import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Film, Zap, AlertTriangle, SkipForward, Settings2, Check, Gauge, MonitorPlay } from "lucide-react";

export type PlayMode = "hls" | "embed";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
  resumeAt = 0,
  onProgress,
  autoPlay = true,
  onEnded,
  syncState,
  onPlayState,
  onNext,
  hasNext = false,
  nextLabel,
  introSkipSeconds = 0,
  nextEpCountdown = 0,
  autoNext = false,
  defaultRate = 1,
  preferredQuality = "auto",
  onQualityChange,
  onRateChange,
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
  resumeAt?: number;
  onProgress?: (position: number, duration: number) => void;
  autoPlay?: boolean;
  onEnded?: () => void;
  /** Trạng thái phát do chủ phòng đẩy xuống (xem chung) */
  syncState?: { position: number; isPlaying: boolean; at: number } | null;
  /** Báo khi người xem play/pause/tua (dùng cho chủ phòng) */
  onPlayState?: (playing: boolean, position: number) => void;
  /** Chuyển tập kế tiếp (thẻ "Tập sau") */
  onNext?: () => void;
  hasNext?: boolean;
  nextLabel?: string;
  /** Mốc giây kết thúc intro cho nút "Bỏ qua intro" */
  introSkipSeconds?: number;
  /** Hiện thẻ tập sau khi còn bao nhiêu giây */
  nextEpCountdown?: number;
  autoNext?: boolean;
  defaultRate?: number;
  preferredQuality?: string;
  onQualityChange?: (q: string) => void;
  onRateChange?: (r: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [skipped, setSkipped] = useState(false);
  const [dismissNext, setDismissNext] = useState(false);
  const [menu, setMenu] = useState(false);
  const [levels, setLevels] = useState<{ index: number; height: number }[]>([]);
  const [rate, setRate] = useState(defaultRate);
  const [quality, setQuality] = useState(preferredQuality);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const resumeRef = useRef(resumeAt);
  resumeRef.current = resumeAt;
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  const playStateRef = useRef(onPlayState);
  playStateRef.current = onPlayState;
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  // Chủ phòng: phát/dừng/tua đẩy cho cả phòng
  useEffect(() => {
    const video = videoRef.current;
    if (mode !== "hls" || !video || !onPlayState) return;
    const emit = () => playStateRef.current?.(!video.paused, video.currentTime);
    video.addEventListener("play", emit);
    video.addEventListener("pause", emit);
    video.addEventListener("seeked", emit);
    return () => {
      video.removeEventListener("play", emit);
      video.removeEventListener("pause", emit);
      video.removeEventListener("seeked", emit);
    };
  }, [mode, m3u8, !!onPlayState]);

  // Người xem: bám theo trạng thái chủ phòng
  useEffect(() => {
    const video = videoRef.current;
    if (mode !== "hls" || !video || !syncState) return;
    const apply = () => {
      const drift = syncState.isPlaying ? (Date.now() - syncState.at) / 1000 : 0;
      const target = syncState.position + drift;
      if (Number.isFinite(target) && Math.abs(video.currentTime - target) > 2.5) {
        video.currentTime = Math.max(0, target);
      }
      if (syncState.isPlaying && video.paused) void video.play().catch(() => {});
      if (!syncState.isPlaying && !video.paused) video.pause();
    };
    if (video.readyState >= 1) apply();
    video.addEventListener("loadedmetadata", apply);
    return () => video.removeEventListener("loadedmetadata", apply);
  }, [mode, syncState?.position, syncState?.isPlaying, syncState?.at]);

  // Tốc độ phát
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  }, [rate, mode, m3u8]);

  useEffect(() => setRate(defaultRate), [defaultRate]);
  useEffect(() => setQuality(preferredQuality), [preferredQuality]);

  // Reset overlay khi đổi nguồn / đổi tập
  useEffect(() => {
    setSkipped(false);
    setDismissNext(false);
    setTime({ current: 0, duration: 0 });
  }, [m3u8, embed, mode]);

  // Tiếp tục xem + lưu tiến độ + phím tắt cho video / remote TV
  useEffect(() => {
    const video = videoRef.current;
    if (mode !== "hls" || !video) return;
    let resumed = false;
    let last = 0;

    const onLoaded = () => {
      const at = resumeRef.current;
      if (!resumed && at > 5 && video.duration && at < video.duration - 30) {
        video.currentTime = at;
      }
      resumed = true;
      video.playbackRate = rate;
      setTime({ current: video.currentTime, duration: video.duration || 0 });
    };
    const onTime = () => {
      setTime({ current: video.currentTime, duration: video.duration || 0 });
      const now = Date.now();
      if (now - last < 5000) return;
      last = now;
      if (video.duration > 0) progressRef.current?.(video.currentTime, video.duration);
    };
    const flush = () => {
      if (video.duration > 0) progressRef.current?.(video.currentTime, video.duration);
    };
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== video) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        video.paused ? void video.play() : video.pause();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        video.currentTime += 10;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        video.currentTime -= 10;
      } else if (e.key.toLowerCase() === "f") {
        void video.requestFullscreen?.();
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    const onEndedEv = () => endedRef.current?.();
    video.addEventListener("pause", flush);
    video.addEventListener("ended", onEndedEv);
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", flush);
      video.removeEventListener("ended", onEndedEv);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", flush);
    };
  }, [mode, m3u8]);


  useEffect(() => {
    setError(null);
    setLevels([]);
    hlsRef.current = null;
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
      hlsRef.current = hls;
      hls.loadSource(m3u8);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const list = (hls?.levels || [])
          .map((l, i) => ({ index: i, height: l.height || 0 }))
          .filter((l) => l.height > 0)
          .sort((a, b) => b.height - a.height);
        setLevels(list);
        if (quality !== "auto" && hls) {
          const want = Number(quality);
          const found = list.find((l) => l.height === want) || list.find((l) => l.height <= want);
          hls.currentLevel = found ? found.index : -1;
          hls.capLevelToPlayerSize = !found;
        }
      });
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
      hlsRef.current = null;
    };
  }, [m3u8, mode, embed, autoFallback, onModeChange, allowHls]);

  const applyQuality = (q: string) => {
    setQuality(q);
    onQualityChange?.(q);
    const hls = hlsRef.current;
    if (!hls) return;
    if (q === "auto") {
      hls.currentLevel = -1;
      hls.capLevelToPlayerSize = true;
      return;
    }
    const want = Number(q);
    const found = levels.find((l) => l.height === want) || levels.find((l) => l.height <= want);
    hls.capLevelToPlayerSize = false;
    hls.currentLevel = found ? found.index : -1;
  };

  const applyRate = (r: number) => {
    setRate(r);
    onRateChange?.(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  const canHls = allowHls && !!m3u8;
  const canEmbed = !!embed;

  const inHls = mode === "hls" && canHls;
  const remaining = time.duration > 0 ? time.duration - time.current : 0;
  const showSkipIntro =
    inHls &&
    introSkipSeconds > 0 &&
    !skipped &&
    time.current > 2 &&
    time.current < introSkipSeconds &&
    time.duration > introSkipSeconds + 60;
  const showNextCard =
    inHls &&
    hasNext &&
    nextEpCountdown > 0 &&
    !dismissNext &&
    time.duration > 0 &&
    remaining > 0 &&
    remaining <= nextEpCountdown;

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
            autoPlay={autoPlay}
            tabIndex={0}

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

        {/* Bỏ qua intro */}
        {showSkipIntro && (
          <button
            type="button"
            onClick={() => {
              setSkipped(true);
              if (videoRef.current) videoRef.current.currentTime = introSkipSeconds;
            }}
            className="absolute bottom-16 right-3 z-20 inline-flex animate-in fade-in slide-in-from-bottom-2 items-center gap-1.5 rounded-lg border border-white/25 bg-black/75 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" /> Bỏ qua intro
          </button>
        )}

        {/* Thẻ tập sau */}
        {showNextCard && (
          <div className="absolute bottom-16 right-3 z-20 w-[min(260px,70%)] animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-white/15 bg-black/85 p-3 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tập tiếp theo</p>
            <p className="mt-0.5 line-clamp-1 text-sm font-bold text-white">{nextLabel || "Tập kế tiếp"}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - (remaining / nextEpCountdown) * 100)}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => nextRef.current?.()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <SkipForward className="h-3.5 w-3.5" /> Xem ngay
              </button>
              <button
                type="button"
                onClick={() => setDismissNext(true)}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
              >
                Ẩn
              </button>
            </div>
            {autoNext && (
              <p className="mt-1.5 text-center text-[10px] text-white/50">
                Tự chuyển sau {Math.ceil(remaining)}s
              </p>
            )}
          </div>
        )}

        {/* Chất lượng & tốc độ */}
        {inHls && (
          <div className="absolute left-3 top-3 z-20">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label="Chất lượng và tốc độ phát"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:border-primary hover:text-white"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {quality === "auto" ? "Auto" : `${quality}p`}
              {rate !== 1 && <span className="text-primary">{rate}x</span>}
            </button>
            {menu && (
              <div className="mt-2 w-44 overflow-hidden rounded-xl border border-white/15 bg-black/90 p-1.5 text-white backdrop-blur">
                <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <MonitorPlay className="h-3 w-3" /> Chất lượng
                </p>
                {["auto", ...levels.map((l) => String(l.height))].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => applyQuality(q)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-white/10"
                  >
                    <span>{q === "auto" ? "Tự động" : `${q}p`}</span>
                    {quality === q && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
                {levels.length === 0 && (
                  <p className="px-2 py-1 text-[11px] text-white/40">Nguồn chỉ có 1 mức chất lượng</p>
                )}
                <p className="mt-1 flex items-center gap-1.5 border-t border-white/10 px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <Gauge className="h-3 w-3" /> Tốc độ
                </p>
                <div className="flex flex-wrap gap-1 px-1 pb-1">
                  {RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => applyRate(r)}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                        rate === r ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>
            )}
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
