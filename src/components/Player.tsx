import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Film, Zap, AlertTriangle } from "lucide-react";

export type PlayMode = "hls" | "embed";

export function Player({
  m3u8,
  embed,
  poster,
  mode,
  onModeChange,
  autoFallback = true,
  allowHls = true,
  hideControls = false,
  fill = false,
}: {
  m3u8?: string;
  embed?: string;
  poster?: string;
  mode: PlayMode;
  onModeChange: (m: PlayMode) => void;
  autoFallback?: boolean;
  allowHls?: boolean;
  hideControls?: boolean;
  fill?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (mode !== "hls" || !allowHls || !m3u8 || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    let fallbackTimer: number | null = null;
    let mediaRecoveryAttempts = 0;

    const triggerFallback = (reason: string) => {
      if (autoFallback && embed) {
        setError(`${reason}, đang chuyển sang Embed…`);
        fallbackTimer = window.setTimeout(() => onModeChange("embed"), 800);
      } else {
        setError(reason);
      }
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
        backBufferLength: 30,
      });
      hls.loadSource(m3u8);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) console.warn("[HLS]", data.type, data.details);
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveryAttempts < 1) {
          mediaRecoveryAttempts += 1;
          hls?.recoverMediaError();
          return;
        }

        const codecError = data.details === Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR;
        triggerFallback(
          codecError
            ? "Trình duyệt này không hỗ trợ codec của video"
            : "Không phát được HLS",
        );
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = m3u8;
      video.addEventListener("error", () => triggerFallback("Trình duyệt không hỗ trợ HLS."));
    } else {
      triggerFallback("Trình duyệt không hỗ trợ HLS.");
    }
    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (hls) hls.destroy();
    };
  }, [m3u8, mode, embed, autoFallback, onModeChange, allowHls]);

  const canHls = allowHls && !!m3u8;
  const canEmbed = !!embed;

  return (
    <div className={fill ? "flex h-full flex-col" : "space-y-3"}>
      <div
        className={`relative overflow-hidden bg-black ${
          fill ? "h-full w-full rounded-lg ring-1 ring-border/60" : "aspect-video rounded-lg ring-1 ring-border/60"
        }`}
      >
        {mode === "hls" && canHls && (
          <video
            ref={videoRef}
            controls
            playsInline
            poster={poster}
            className="h-full w-full"
          />
        )}
        {mode === "embed" && canEmbed && (
          <iframe
            src={embed}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            title="Trình phát embed"
          />
        )}
        {mode === "hls" && !canHls && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nguồn HLS không khả dụng
          </div>
        )}
        {mode === "embed" && !canEmbed && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nguồn Embed không khả dụng
          </div>
        )}
        <div className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
          Lạc Việt Cinema
        </div>
      </div>

      {!hideControls && (
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border border-border bg-card">
          {allowHls && (
          <button
            disabled={!canHls}
            onClick={() => onModeChange("hls")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              mode === "hls" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> HLS (m3u8)
          </button>
          )}
          <button
            disabled={!canEmbed}
            onClick={() => onModeChange("embed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              mode === "embed" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
            }`}
          >
            <Film className="h-3.5 w-3.5" /> Embed
          </button>
        </div>
        {error && (
          <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </span>
        )}
      </div>
      )}
    </div>
  );
}
