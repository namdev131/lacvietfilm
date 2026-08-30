import { useEffect, useRef, useState, type ReactNode } from "react";
import Hls from "hls.js";
import {
  AlertTriangle, Check, ChevronLeft, Film, Gauge, Maximize, Pause, Play,
  RotateCcw, RotateCw, Settings2, SkipForward, Volume2, VolumeX, Zap,
} from "lucide-react";
import { beginNextEpisode, cancelNextEpisode, tickNextEpisode, type NextEpisodeState } from "@/lib/nextEpisode";

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
  title,
  episodeLabel,
  overlay,
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
  title?: string;
  episodeLabel?: string;
  /** Nội dung phải nằm trong fullscreen element, ví dụ thông báo chat Watch Party. */
  overlay?: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [skipped, setSkipped] = useState(false);
  const [nextState, setNextState] = useState<NextEpisodeState>({ status: "idle", seconds: 10 });
  const [menu, setMenu] = useState(false);
  const [levels, setLevels] = useState<{ index: number; height: number }[]>([]);
  const [rate, setRate] = useState(defaultRate);
  const [quality, setQuality] = useState(preferredQuality);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const seekFrameRef = useRef<number | null>(null);
  const seekValueRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
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
    setNextState({ status: "idle", seconds: 10 });
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
      if (seekingRef.current) return;
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
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        video.volume = Math.max(0, Math.min(1, video.volume + (e.key === "ArrowUp" ? 0.1 : -0.1)));
      } else if (e.key.toLowerCase() === "m") {
        video.muted = !video.muted;
      } else if (e.key.toLowerCase() === "f") {
        void frameRef.current?.requestFullscreen?.();
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    const onEndedEv = () => {
      endedRef.current?.();
      setNextState(beginNextEpisode(hasNext, autoNext && nextEpCountdown > 0));
    };
    const onSeeked = () => {
      seekingRef.current = false;
      seekValueRef.current = null;
      setSeekPreview(null);
      setTime({ current: video.currentTime, duration: video.duration || 0 });
    };
    video.addEventListener("pause", flush);
    video.addEventListener("ended", onEndedEv);
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", flush);
      video.removeEventListener("ended", onEndedEv);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", flush);
    };
  }, [mode, m3u8, hasNext, autoNext, nextEpCountdown]);

  useEffect(() => {
    if (nextState.status !== "counting") return;
    const timer = window.setTimeout(() => setNextState((state) => tickNextEpisode(state)), 1000);
    return () => window.clearTimeout(timer);
  }, [nextState.status, nextState.seconds]);

  useEffect(() => {
    if (nextState.status !== "ready") return;
    nextRef.current?.();
  }, [nextState.status]);


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
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
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
    setMenu(false);
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
    setMenu(false);
    onRateChange?.(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  const canHls = allowHls && !!m3u8;
  const canEmbed = !!embed;

  const inHls = mode === "hls" && canHls;

  const showSkipIntro =
    inHls &&
    introSkipSeconds > 0 &&
    !skipped &&
    time.current > 2 &&
    time.current < introSkipSeconds &&
    time.duration > introSkipSeconds + 60;
  const showNextCard = inHls && hasNext && (nextState.status === "counting" || nextState.status === "manual");

  const formatClock = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (video) video.paused ? void video.play() : video.pause();
  };
  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + seconds));
  };
  const previewSeek = (value: number) => {
    seekValueRef.current = value;
    if (seekFrameRef.current !== null) cancelAnimationFrame(seekFrameRef.current);
    seekFrameRef.current = requestAnimationFrame(() => {
      setSeekPreview(value);
      seekFrameRef.current = null;
    });
  };
  const beginSeek = () => hlsRef.current?.stopLoad();
  const commitSeek = () => {
    const video = videoRef.current;
    if (seekFrameRef.current !== null) {
      cancelAnimationFrame(seekFrameRef.current);
      seekFrameRef.current = null;
    }
    const target = seekValueRef.current;
    if (video && target !== null) {
      seekingRef.current = true;
      setSeekPreview(target);
      setTime({ current: target, duration: video.duration || time.duration });
      video.currentTime = target;
      hlsRef.current?.startLoad(target);
    } else {
      hlsRef.current?.startLoad();
    }
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };
  const requestFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  };

  return (
    <div className={fill ? "flex h-full flex-col" : "space-y-3"}>
      <div
        ref={frameRef}
        className={`player-frame relative overflow-hidden bg-black ${
          fill ? "h-full w-full rounded-lg ring-1 ring-border/60" : "aspect-video rounded-lg ring-1 ring-border/60"
        }`}
      >
        {overlay}
        {mode === "hls" && canHls && (
          <video
            ref={videoRef}
            controls={false}
            autoPlay={autoPlay}
            tabIndex={0}
            playsInline
            poster={poster}
            className="h-full w-full object-contain"
            onClick={togglePlay}
            onDoubleClick={requestFull}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onVolumeChange={(e) => {
              setVolume(e.currentTarget.volume);
              setMuted(e.currentTarget.muted);
            }}
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

        {inHls && (
          <div className="player-chrome group/player absolute inset-0 z-10 flex flex-col justify-between opacity-100 md:opacity-0 md:hover:opacity-100 md:focus-within:opacity-100">
            <div className="player-topbar flex items-start justify-between gap-3 p-3 md:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => history.back()} aria-label="Quay lại" className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 bg-black/45 text-white backdrop-blur hover:border-amber-400/60">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 text-white">
                  <p className="truncate text-sm font-semibold md:text-base">{title || "Lạc Việt Film"}{episodeLabel ? ` · ${episodeLabel}` : ""}</p>
                  <p className="mt-0.5 hidden truncate text-[11px] text-white/55 sm:block">Phim bộ › {title || "Đang phát"} › {episodeLabel || "Tập hiện tại"}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white/65 backdrop-blur">{mode}</span>
            </div>

            <div className="player-bottombar px-3 pb-3 pt-14 md:px-5 md:pb-4">
              <div className="mb-2 flex items-center gap-3 text-[11px] tabular-nums text-white/75">
                <input
                  type="range"
                  min={0}
                  max={time.duration || 0}
                  step={0.1}
                  value={Math.min(seekPreview ?? time.current, time.duration || 0)}
                  onInput={(e) => previewSeek(Number(e.currentTarget.value))}
                  onChange={(e) => previewSeek(Number(e.currentTarget.value))}
                  onPointerDown={beginSeek}
                  onPointerUp={commitSeek}
                  onPointerCancel={commitSeek}
                  onKeyUp={commitSeek}
                  aria-label="Tiến trình video"
                  className="player-timeline h-2 flex-1 cursor-pointer accent-amber-400"
                />
                <span>{formatClock(seekPreview ?? time.current)} / {formatClock(time.duration)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button type="button" onClick={togglePlay} aria-label="Phát / Tạm dừng" className="grid h-10 w-10 place-items-center rounded-full border border-amber-400 text-white hover:bg-amber-400 hover:text-black">
                    {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>
                  {hasNext && <button type="button" onClick={() => nextRef.current?.()} aria-label="Chuyển thủ công sang tập tiếp theo" className="player-next-button grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white"><SkipForward className="h-4 w-4" /></button>}
                  <button type="button" onClick={() => seekBy(-10)} aria-label="Tua lùi 10 giây" className="grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white"><RotateCcw className="h-4 w-4" /></button>
                  <button type="button" onClick={() => seekBy(10)} aria-label="Tua tới 10 giây" className="grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white"><RotateCw className="h-4 w-4" /></button>
                  <button type="button" onClick={toggleMute} aria-label="Bật / Tắt âm" className="grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white">{muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => { const v = Number(e.target.value); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = false; } setVolume(v); setMuted(false); }} aria-label="Âm lượng" className="hidden h-1 w-20 accent-amber-400 lg:block" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden text-[11px] font-semibold text-white/55 md:inline">{quality === "auto" ? "Auto" : `${quality}p`} · {rate}x</span>
                  <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Cài đặt phát" aria-expanded={menu} className="grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white"><Settings2 className="h-4 w-4" /></button>
                  <button type="button" onClick={requestFull} aria-label="Toàn màn hình" className="grid h-9 w-9 place-items-center rounded-md text-white/75 hover:bg-white/10 hover:text-white"><Maximize className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
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
          <div className="next-episode-overlay absolute inset-0 z-20 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="next-episode-card w-full max-w-sm border border-white/15 bg-[#0a0e13]/95 p-5 text-center shadow-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-300">Tập tiếp theo</p>
              <p className="mt-2 line-clamp-2 text-lg font-bold text-white">{nextLabel || "Tập kế tiếp"}</p>
              {nextState.status === "counting" && (
                <div className="next-countdown mx-auto mt-4 grid h-16 w-16 place-items-center rounded-full border border-amber-300/45 text-2xl font-black text-amber-300">
                  {nextState.seconds}
                </div>
              )}
              <p className="mt-3 text-xs text-white/55">
                {nextState.status === "counting" ? `Tự chuyển sau ${nextState.seconds} giây` : "Chọn chuyển tập khi bạn sẵn sàng"}
              </p>
              <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => nextRef.current?.()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-amber-300 px-3 py-2.5 text-xs font-bold text-black"
              >
                <SkipForward className="h-3.5 w-3.5" /> Chuyển ngay
              </button>
              <button
                type="button"
                onClick={() => setNextState(cancelNextEpisode())}
                className="rounded-md border border-white/25 px-3 py-2.5 text-xs font-medium text-white/80 hover:bg-white/10"
              >
                Ở lại tập này
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Chất lượng & tốc độ */}
        {inHls && menu && (
          <div className="absolute bottom-20 right-3 z-30 md:right-5">
              <div className="w-44 overflow-hidden rounded-xl border border-white/15 bg-black/90 p-1.5 text-white backdrop-blur">
                <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <Settings2 className="h-3 w-3" /> Chất lượng
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
          </div>
        )}

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
