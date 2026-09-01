import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Heart,
  Radio,
  Users,
} from "lucide-react";
import {
  KIND_LABEL,
  PERIOD_LABEL,
  useGoldBoard,
  useLiveViewers,
  type GoldKind,
  type GoldPeriod,
  type GoldRow,
} from "@/lib/gold";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useToggleFavorite } from "@/hooks/useUserData";
import type { SourceId } from "@/lib/types";

const PERIODS: GoldPeriod[] = ["day", "week", "month", "all"];
const KINDS: GoldKind[] = ["all", "series", "single", "anime"];
const SOURCES: ("all" | SourceId)[] = ["all", "kkphim", "ophim", "nguonc", "vsmov"];

function FavoriteButton({ row, active }: { row: GoldRow; active: boolean }) {
  const { user } = useAuth();
  const toggle = useToggleFavorite();
  if (!user) return null;
  return (
    <button
      type="button"
      aria-label={active ? "Bỏ yêu thích" : "Yêu thích"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({
          slug: row.slug,
          name: row.name,
          poster: row.poster ?? undefined,
          source: row.source,
          isFav: active,
        });
      }}
      className="absolute right-2 top-2 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/65 text-white transition hover:bg-primary"
    >
      <Heart className={`h-4 w-4 ${active ? "fill-current text-primary" : ""}`} />
    </button>
  );
}

export function GoldBoard() {
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<GoldPeriod>("day");
  const [kind, setKind] = useState<GoldKind>("all");
  const [source, setSource] = useState<"all" | SourceId>("all");
  const { data, isLoading } = useGoldBoard(period, kind);
  const viewers = useLiveViewers();
  const { data: favorites } = useFavorites();
  const favoriteSlugs = useMemo(() => new Set((favorites ?? []).map((item) => item.slug)), [favorites]);
  const rows = useMemo(
    () => (source === "all" ? data ?? [] : (data ?? []).filter((row) => row.source === source)),
    [data, source],
  );
  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const element = track.current;
    if (!element) return;
    setAtStart(element.scrollLeft <= 8);
    setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const element = track.current;
    updateEdges();
    if (!element) return;
    element.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      element.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [rows.length, updateEdges]);

  const scroll = (direction: 1 | -1) => {
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="movie-shelf trending-gold relative" aria-labelledby="trending-title">
      <div className="movie-row-inner shelf-heading trending-gold-heading mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="trending-title" className="flex items-center gap-2 text-lg font-semibold md:text-xl">
            <Flame className="h-5 w-5 text-primary" /> Top thịnh hành
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Bảng Vàng theo lượt xem thực tế</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {totalViews > 0 && <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{totalViews.toLocaleString("vi-VN")} lượt</span>}
          {viewers > 0 && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{viewers} đang xem</span>}
          <span className="inline-flex items-center gap-1"><Radio className="h-3.5 w-3.5 text-primary" />Realtime</span>
        </div>
      </div>

      <div className="movie-row-inner trending-filters mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterGroup values={PERIODS} value={period} onChange={setPeriod} label={(value) => PERIOD_LABEL[value]} />
        <FilterGroup values={KINDS} value={kind} onChange={setKind} label={(value) => KIND_LABEL[value]} />
        <FilterGroup values={SOURCES} value={source} onChange={setSource} label={(value) => value === "all" ? "Mọi nguồn" : value} />
      </div>

      {isLoading ? (
        <div className="movie-row-inner flex gap-3 overflow-hidden md:gap-4">
          {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[280px] w-[160px] shrink-0 rounded-xl bg-card shimmer md:w-[200px]" />)}
        </div>
      ) : rows.length ? (
        <div className="relative">
          <button type="button" aria-label="Cuộn sang trái" disabled={atStart} onClick={() => scroll(-1)} className="trending-arrow left-2"><ChevronLeft className="h-6 w-6" /></button>
          <div ref={track} tabIndex={0} className="scroll-row movie-row-inner shelf-track flex gap-3 overflow-x-auto scroll-smooth pb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:gap-4">
            <AnimatePresence mode="popLayout">
              {rows.map((row, index) => (
                <motion.article
                  layout
                  key={`${row.source}-${row.slug}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.96 }}
                  whileHover={reduceMotion ? undefined : { y: -10, scale: 1.035 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 24, delay: index * 0.055 }}
                  data-rank={row.rank}
                  className={`trending-card group relative shrink-0 ${row.rank === 1 ? "trending-champion w-[180px] sm:w-[200px] md:w-[220px]" : "w-[160px] sm:w-[180px] md:w-[200px]"}`}
                >
                  <Link to="/movie/$slug" params={{ slug: row.slug }} search={{ src: row.source }} className="block">
                    <div className="movie-card-frame trending-poster relative aspect-[2/3] overflow-hidden bg-card ring-1 ring-border/50">
                      {row.poster ? <img src={row.poster} alt={row.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full bg-muted" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
                      <span className="trending-sheen" aria-hidden="true" />
                      <strong className="trending-rank absolute bottom-1 left-2 z-20 text-7xl font-black leading-none">{row.rank}</strong>
                      {row.prev_rank !== null && row.prev_rank > row.rank && (
                        <span
                          aria-label={`Tăng ${row.prev_rank - row.rank} hạng`}
                          title={`Tăng ${row.prev_rank - row.rank} hạng`}
                          className="absolute left-2 top-12 z-20 inline-flex items-center gap-0.5 rounded-full bg-emerald-950/85 px-2 py-1 text-[11px] font-bold text-emerald-400 shadow-lg"
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          {row.prev_rank - row.rank}
                        </span>
                      )}
                      {row.prev_rank !== null && row.prev_rank < row.rank && (
                        <span
                          aria-label={`Giảm ${row.rank - row.prev_rank} hạng`}
                          title={`Giảm ${row.rank - row.prev_rank} hạng`}
                          className="absolute left-2 top-12 z-20 inline-flex items-center gap-0.5 rounded-full bg-red-950/85 px-2 py-1 text-[11px] font-bold text-red-400 shadow-lg"
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          {row.rank - row.prev_rank}
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded bg-black/65 px-2 py-1 text-[11px] text-white"><Eye className="h-3 w-3" />{row.views}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{row.name}</h3>
                    <p className="mt-1 text-xs uppercase text-muted-foreground">{row.source} · {PERIOD_LABEL[period]}</p>
                  </Link>
                  <FavoriteButton row={row} active={favoriteSlugs.has(row.slug)} />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
          <button type="button" aria-label="Cuộn sang phải" disabled={atEnd} onClick={() => scroll(1)} className="trending-arrow right-2"><ChevronRight className="h-6 w-6" /></button>
        </div>
      ) : (
        <div className="movie-row-inner rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">Chưa có lượt xem trong bộ lọc này.</div>
      )}
    </section>
  );
}

function FilterGroup<T extends string>({ values, value, onChange, label }: { values: readonly T[]; value: T; onChange: (value: T) => void; label: (value: T) => string }) {
  return (
    <div className="flex shrink-0 rounded-full border border-border bg-card/60 p-0.5">
      {values.map((item) => (
        <button key={item} type="button" onClick={() => onChange(item)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${value === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label(item)}</button>
      ))}
    </div>
  );
}
