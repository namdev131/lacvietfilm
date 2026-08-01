import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

interface Ctx {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, set: () => {}, reset: () => {} });

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Đọc sau khi hydrate để tránh lệch SSR
  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("lv-settings-change", { detail: next }));
  }, []);

  const set = useCallback<Ctx["set"]>((key, value) => {
    persist({ ...readSettings(), [key]: value });
  }, [persist]);

  const reset = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

  // Áp dụng lên document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", settings.reduceMotion);
    root.classList.toggle("tv-mode", settings.tvMode);
  }, [settings.reduceMotion, settings.tvMode]);

  const value = useMemo(() => ({ settings, set, reset }), [settings, set, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
