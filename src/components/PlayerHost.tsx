import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { X, Maximize2, GripVertical } from "lucide-react";
import { Player, type PlayMode } from "@/components/Player";
import type { SourceId } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { getLocalProgress, setLocalProgress, syncProgress } from "@/lib/progress";
import { useSettings } from "@/lib/settings";


export type Playback = {
  slug: string;
  source: SourceId;
  name: string;
  epLabel?: string;
  ep: number;
  srv: number;
  m3u8?: string;
  embed?: string;
  poster?: string;
  allowHls: boolean;
  mode: PlayMode;
  /** Gọi khi tập hiện tại phát xong (dùng cho tự chuyển tập) */
  onEnded?: () => void;
};

type Ctx = {
  playback: Playback | null;
  start: (p: Playback) => void;
  stop: () => void;
  setMode: (m: PlayMode) => void;
  registerDock: (el: HTMLElement | null) => void;
  docked: boolean;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function usePlayerHost() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayerHost must be used inside PlayerHostProvider");
  return ctx;
}

/**
 * Đăng ký khung chứa trên trang xem phim để trình phát "gắn" vào đó.
 * Dùng callback ref để bắt được cả khi node bị thay (skeleton -> nội dung thật),
 * tránh việc trình phát bám vào node cũ đã bị gỡ khỏi DOM.
 */
export function usePlayerDock() {
  const { registerDock } = usePlayerHost();
  return useCallback(
    (el: HTMLDivElement | null) => {
      registerDock(el);
    },
    [registerDock],
  );
}

function sameMedia(a: Playback | null, b: Playback) {
  return (
    !!a &&
    a.slug === b.slug &&
    a.source === b.source &&
    a.ep === b.ep &&
    a.srv === b.srv &&
    a.m3u8 === b.m3u8 &&
    a.embed === b.embed &&
    a.mode === b.mode
  );
}

export function PlayerHostProvider({ children }: { children: ReactNode }) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [dockEl, setDockEl] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const { user } = useAuth();
  const { settings } = useSettings();
  const userRef = useRef<string | null>(null);
  userRef.current = user?.id ?? null;

  const resumeAt = playback
    ? (getLocalProgress(playback.source, playback.slug, playback.srv, playback.ep)?.position ?? 0)
    : 0;

  const handleProgress = useCallback(
    (position: number, duration: number) => {
      const p = playback;
      if (!p) return;
      setLocalProgress({ slug: p.slug, source: p.source, ep: p.ep, srv: p.srv, position, duration });
      const uid = userRef.current;
      if (uid) {
        void syncProgress(uid, {
          slug: p.slug,
          name: p.name,
          poster: p.poster,
          source: p.source,
          ep: p.ep,
          srv: p.srv,
          episode_name: p.epLabel,
          position,
          duration,
        });
      }
    },
    [playback],
  );


  const start = useCallback((p: Playback) => {
    setPlayback((prev) => (sameMedia(prev, p) ? { ...prev!, name: p.name, epLabel: p.epLabel, onEnded: p.onEnded } : p));
  }, []);
  const stop = useCallback(() => setPlayback(null), []);
  const setMode = useCallback(
    (m: PlayMode) => setPlayback((prev) => (prev ? { ...prev, mode: m } : prev)),
    [],
  );
  const registerDock = useCallback((el: HTMLElement | null) => setDockEl(el), []);

  // Theo dõi vị trí khung chứa để trình phát luôn nằm đúng chỗ mà không remount.
  useEffect(() => {
    if (!dockEl) {
      setRect(null);
      return;
    }
    const update = () => setRect(dockEl.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(dockEl);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 400);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearInterval(id);
    };
  }, [dockEl]);

  const value = useMemo<Ctx>(
    () => ({ playback, start, stop, setMode, registerDock, docked: !!dockEl }),
    [playback, start, stop, setMode, registerDock, dockEl],
  );

  const miniRaw = !dockEl || !dockEl.isConnected || !rect || rect.width < 80 || rect.height < 80;
  const mini = miniRaw;
  const hidePlayer = mini && !settings.miniPlayer;
  const playKey = playback
    ? `${playback.source}-${playback.slug}-${playback.srv}-${playback.ep}-${playback.mode}`
    : "none";

  const onDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    const el = e.currentTarget.parentElement as HTMLElement | null;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const dx = e.clientX - box.left;
    const dy = e.clientY - box.top;
    setDrag({ x: box.left, y: box.top });
    const move = (ev: PointerEvent) => {
      const x = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - box.width);
      const y = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - box.height);
      setDrag({ x, y });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      {playback && !hidePlayer && (
        <div
          className={
            mini
              ? "fixed z-[60] w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              : "fixed z-30"
          }
          style={
            mini
              ? drag
                ? { top: drag.y, left: drag.x }
                : { bottom: "6rem", right: "0.75rem" }
              : { top: rect!.top, left: rect!.left, width: rect!.width, height: rect!.height }
          }
        >
          {mini && (
            <div
              onPointerDown={onDragStart}
              className="flex cursor-grab touch-none select-none items-center gap-1 border-b border-border bg-card px-2 py-1.5 active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-[11px] font-semibold">{playback.name}</div>
                {playback.epLabel && (
                  <div className="line-clamp-1 text-[10px] text-muted-foreground">{playback.epLabel}</div>
                )}
              </div>
              <Link
                to="/watch/$slug"
                params={{ slug: playback.slug }}
                search={{ src: playback.source, ep: playback.ep, srv: playback.srv }}
                aria-label="Xem toàn màn hình"
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={stop}
                aria-label="Đóng trình phát"
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Player
            key={playKey}
            m3u8={playback.m3u8}
            embed={playback.embed}
            poster={playback.poster}
            mode={playback.allowHls ? playback.mode : "embed"}
            onModeChange={setMode}
            allowHls={playback.allowHls}
            autoPlay={settings.autoPlay}
            onEnded={playback.onEnded}
            autoFallback={settings.autoFallback}
            hideControls
            fill={!mini}
            resumeAt={resumeAt}
            onProgress={handleProgress}

          />
        </div>
      )}
    </PlayerCtx.Provider>
  );
}
