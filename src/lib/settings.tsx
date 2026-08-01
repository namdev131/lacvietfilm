import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export type LangPref = "auto" | "vietsub" | "thuyetminh";
export type SourcePref = SourceId | "all";

export interface Settings {
  /** Nguồn phim mặc định khi mở trang chủ / tìm kiếm */
  defaultSource: SourcePref;
  /** Ngôn ngữ ưu tiên khi chọn server */
  langPref: LangPref;
  /** Chế độ phát mặc định */
  defaultMode: "hls" | "embed";
  /** Tự chuyển sang Embed khi HLS lỗi */
  autoFallback: boolean;
  /** Tự chuyển tập tiếp theo khi hết tập */
  autoNext: boolean;
  /** Tự phát khi mở trang xem */
  autoPlay: boolean;
  /** Bật mini player khi rời trang xem */
  miniPlayer: boolean;
  /** Giảm hiệu ứng chuyển động */
  reduceMotion: boolean;
  /** Chế độ TV (focus lớn, điều khiển bằng remote) */
  tvMode: boolean;
  /** Lưu lịch sử xem */
  saveHistory: boolean;
  /** Lưu lịch sử tìm kiếm */
  saveSearchHistory: boolean;
  /** Đồng bộ cài đặt lên Cloud giữa các thiết bị */
  cloudSync: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultSource: "all",
  langPref: "auto",
  defaultMode: "hls",
  autoFallback: true,
  autoNext: true,
  autoPlay: true,
  miniPlayer: true,
  reduceMotion: false,
  tvMode: false,
  saveHistory: true,
  saveSearchHistory: true,
  cloudSync: true,
};

const LS_KEY = "lv-settings";

export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(LS_KEY) || "{}") as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Chỉ giữ các khoá hợp lệ để không nuốt rác từ Cloud */
function sanitize(input: unknown): Partial<Settings> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = (input as Record<string, unknown>)[k];
    if (v !== undefined && typeof v === typeof DEFAULT_SETTINGS[k]) out[k] = v;
  }
  return out as Partial<Settings>;
}

export type SyncState = "off" | "idle" | "syncing" | "synced" | "error";

interface Ctx {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
  syncState: SyncState;
  /** Đẩy cài đặt của thiết bị này lên Cloud ngay */
  pushNow: () => Promise<void>;
  lastSyncedAt: number | null;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  set: () => {},
  reset: () => {},
  syncState: "off",
  pushNow: async () => {},
  lastSyncedAt: null,
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [syncState, setSyncState] = useState<SyncState>("off");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const { user } = useAuth();
  const applyingRemote = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đọc sau khi hydrate để tránh lệch SSR
  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const writeLocal = useCallback((next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("lv-settings-change", { detail: next }));
  }, []);

  const pushCloud = useCallback(
    async (next: Settings) => {
      if (!user || !next.cloudSync) return;
      setSyncState("syncing");
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, data: next as unknown as Record<string, unknown>, updated_at: new Date().toISOString() } as never, {
          onConflict: "user_id",
        });
      if (error) {
        setSyncState("error");
        return;
      }
      setLastSyncedAt(Date.now());
      setSyncState("synced");
    },
    [user],
  );

  const persist = useCallback(
    (next: Settings) => {
      writeLocal(next);
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => void pushCloud(next), 600);
    },
    [writeLocal, pushCloud],
  );

  const set = useCallback<Ctx["set"]>(
    (key, value) => {
      persist({ ...readSettings(), [key]: value });
    },
    [persist],
  );

  const reset = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

  const pushNow = useCallback(async () => {
    await pushCloud(readSettings());
  }, [pushCloud]);

  // Kéo cài đặt từ Cloud khi đăng nhập + lắng nghe realtime giữa các thiết bị
  useEffect(() => {
    if (!user) {
      setSyncState("off");
      return;
    }
    let cancelled = false;

    (async () => {
      const local = readSettings();
      if (!local.cloudSync) {
        setSyncState("off");
        return;
      }
      setSyncState("syncing");
      const { data, error } = await supabase.from("user_settings").select("data").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) {
        setSyncState("error");
        return;
      }
      if (data?.data) {
        applyingRemote.current = true;
        writeLocal({ ...DEFAULT_SETTINGS, ...local, ...sanitize(data.data) });
        applyingRemote.current = false;
        setLastSyncedAt(Date.now());
        setSyncState("synced");
      } else {
        await pushCloud(local);
      }
    })();

    const channel = supabase
      .channel(`user_settings:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_settings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const remote = sanitize((payload.new as { data?: unknown } | null)?.data);
          if (!Object.keys(remote).length) return;
          const local = readSettings();
          if (!local.cloudSync) return;
          const merged = { ...local, ...remote };
          if (JSON.stringify(merged) === JSON.stringify(local)) return;
          applyingRemote.current = true;
          writeLocal(merged);
          applyingRemote.current = false;
          setLastSyncedAt(Date.now());
          setSyncState("synced");
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user?.id, writeLocal, pushCloud]);

  // Áp dụng lên document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", settings.reduceMotion);
    root.classList.toggle("tv-mode", settings.tvMode);
  }, [settings.reduceMotion, settings.tvMode]);

  const value = useMemo(
    () => ({ settings, set, reset, syncState, pushNow, lastSyncedAt }),
    [settings, set, reset, syncState, pushNow, lastSyncedAt],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
