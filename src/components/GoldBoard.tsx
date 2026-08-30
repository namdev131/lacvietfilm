import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Crown,
  Radio,
  ChevronUp,
  ChevronDown,
  Minus,
  Flame,
  Eye,
  Heart,
  Users,
  CheckCircle2,
  Play,
} from "lucide-react";
import {
  useGoldBoard,
  useLiveViewers,
  PERIOD_LABEL,
  KIND_LABEL,
  type GoldPeriod,
  type GoldKind,
  type GoldRow,
} from "@/lib/gold";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useHistory, useToggleFavorite } from "@/hooks/useUserData";
import type { SourceId } from "@/lib/types";

const PERIODS: GoldPeriod[] = ["day", "week", "month", "all"];
const KINDS: GoldKind[] = ["all", "series", "single", "anime"];
const SOURCES: ("all" | SourceId)[] = ["all", "kkphim", "ophim", "nguonc", "vsmov"];

function Delta({ row }: { row: GoldRow }) {
  if (row.prev_rank == null)
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
        <Flame className="h-3 w-3" /> Mới
      </span>
    );
  const diff = row.prev_rank - row.rank;
  if (diff === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Minus className="h-3 w-3" />
      </span>
    );
  const up = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        up ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {up ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {Math.abs(diff)}
      {up && diff >= 3 && <Flame className="ml-0.5 h-3 w-3 text-[color:var(--color-gold)]" />}
    </span>
  );
}

function HeartBtn({ row, isFav }: { row: GoldRow; isFav: boolean }) {
  const { user } = useAuth();
  const toggle = useToggleFavorite();
  if (!user) return null;
  return (
    <button
      aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({
          slug: row.slug,
          name: row.name,
          poster: row.poster ?? undefined,
          source: row.source as SourceId,
          isFav,
        });
      }}
      className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
    >
      <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : ""}`} />
    </button>
  );
}

export function GoldBoard() {
  const [period, setPeriod] = useState<GoldPeriod>("day");
  const [kind, setKind] = useState<GoldKind>("all");
  const [srcFilter, setSrcFilter] = useState<"all" | SourceId>("all");
  const { data, isLoading } = useGoldBoard(period, kind);
  const viewers = useLiveViewers();
  const { data: favs } = useFavorites();
  const { data: history } = useHistory();

  const favSet = useMemo(() => new Set((favs ?? []).map((f) => f.slug)), [favs]);
  const seenSet = useMemo(() => new Set((history ?? []).map((h) => h.slug)), [history]);

  const all = data ?? [];
  const rows = useMemo(
    () => (srcFilter === "all" ? all : all.filter((r) => r.source === srcFilter)),
    [all, srcFilter],
  );
  const topViews = rows[0]?.views ?? 0;
  const totalViews = all.reduce((s, r) => s + (r.views || 0), 0);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 5);

  return (
    <section className="gold-board px-4 md:px-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight">
          <Crown className="h-5 w-5 text-[color:var(--color-gold)]" />
          Bảng Vàng
          <span className="text-xs font-normal text-muted-foreground">Xếp hạng theo lượt xem</span>
        </h2>
        <div className="flex items-center gap-2">
          {totalViews > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Eye className="h-3 w-3 text-[color:var(--color-gold)]" />
              {totalViews.toLocaleString("vi-VN")} lượt · {PERIOD_LABEL[period]}
            </span>
          )}
          {viewers > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3 text-[color:var(--color-gold)]" />
              {viewers} đang xem
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Radio className="h-3 w-3 animate-pulse text-primary" />
            Thời gian thực
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-card/60 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-border bg-card/60 p-0.5">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                kind === k
                  ? "bg-[color:var(--color-gold)] text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-border bg-card/60 p-0.5">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSrcFilter(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase transition ${
                srcFilter === s
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Mọi nguồn" : s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-card/60 shimmer" />
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
          <Crown className="mx-auto mb-2 h-6 w-6 text-[color:var(--color-gold)]" />
          <p className="text-sm text-muted-foreground">
            Chưa có lượt xem nào trong kỳ này. Hãy xem một bộ phim để mở màn Bảng Vàng!
          </p>
        </div>
      )}

      {/* Podium top 3 — poster lớn, bố cục lệch tầng */}
      {podium.length > 0 && (
        <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-3 md:gap-6">
          <AnimatePresence mode="popLayout">
            {podium.map((m) => {
              const first = m.rank === 1;
              return (
                <motion.div
                  layout
                  key={`${m.source}-${m.slug}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  className={`${first ? "col-span-2 md:col-span-1 md:-mt-10 md:order-2" : m.rank === 2 ? "md:order-1 md:mt-6" : "md:order-3 md:mt-10"}`}
                >
                  <Link
                    to="/movie/$slug"
                    params={{ slug: m.slug }}
                    search={{ src: m.source }}
                    className="group relative block"
                  >
                    {/* viền vàng gradient */}
                    <div
                      className={`relative rounded-2xl p-[2px] transition duration-300 ${
                        first
                          ? "bg-[linear-gradient(140deg,var(--color-gold),transparent_45%,var(--color-gold))] shadow-[0_25px_60px_-25px_var(--color-gold)]"
                          : "bg-[linear-gradient(140deg,hsl(var(--border)),transparent_55%,hsl(var(--border)))] group-hover:bg-[linear-gradient(140deg,var(--color-gold),transparent_55%,var(--color-gold))]"
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden rounded-[14px] bg-card ${
                          first ? "aspect-[3/4]" : "aspect-[2/3]"
                        }`}
                      >
                        {m.poster && (
                          <img
                            src={m.poster}
                            alt={m.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-90" />

                        {/* số thứ hạng khổng lồ */}
                        <span
                          className={`pointer-events-none absolute -bottom-4 -left-1 select-none font-black leading-none tracking-tighter ${
                            first
                              ? "text-[7rem] text-[color:var(--color-gold)]/85 md:text-[9rem]"
                              : "text-[5rem] text-white/20 md:text-[6.5rem]"
                          }`}
                          style={first ? { WebkitTextStroke: "1px rgba(0,0,0,0.35)" } : undefined}
                        >
                          {m.rank}
                        </span>

                        {first && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[color:var(--color-gold)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-black shadow-lg">
                            <Crown className="h-3.5 w-3.5" /> Quán quân
                          </span>
                        )}
                        {seenSet.has(m.slug) && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[10px] text-white">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Đã xem
                          </span>
                        )}

                        <div className="absolute inset-x-3 bottom-3 pl-14 md:pl-20">
                          <div
                            className={`line-clamp-2 font-bold text-white ${
                              first ? "text-base md:text-xl" : "text-sm md:text-base"
                            }`}
                          >
                            {m.name}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                              <Eye className="h-3 w-3" /> {m.views}
                            </span>
                            <Delta row={m} />
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">
                              {m.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Vị trí 4–5 */}
      {rest.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
            Vị trí 4–5
          </h3>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {rest.map((m, i) => (
                <motion.div
                  layout
                  key={`${m.source}-${m.slug}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/70 p-2 pr-2 transition hover:border-[color:var(--color-gold)]/60 hover:bg-card">
                    <Link
                      to="/movie/$slug"
                      params={{ slug: m.slug }}
                      search={{ src: m.source }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="w-8 shrink-0 text-center text-xl font-black tabular-nums text-muted-foreground">
                        {m.rank}
                      </span>
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                        {m.poster && (
                          <img
                            src={m.poster}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                          {m.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {m.views} lượt
                          </span>
                          <Delta row={m} />
                          {seenSet.has(m.slug) && (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Đã xem
                            </span>
                          )}
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                            {m.source}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[color:var(--color-gold)]"
                            style={{
                              width: `${topViews ? Math.max(6, (m.views / topViews) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/watch/$slug"
                      params={{ slug: m.slug }}
                      search={{ src: m.source, ep: 0, srv: 0 }}
                      aria-label={`Xem ${m.name}`}
                      className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground opacity-90 transition hover:opacity-100"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </Link>
                    <HeartBtn row={m} isFav={favSet.has(m.slug)} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  );
}
