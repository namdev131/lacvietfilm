import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Crown, Radio, ChevronUp, ChevronDown, Minus, Flame, Eye, Heart, Users, CheckCircle2 } from "lucide-react";
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
  const { data, isLoading } = useGoldBoard(period, kind);
  const viewers = useLiveViewers();
  const { data: favs } = useFavorites();
  const { data: history } = useHistory();

  const favSet = useMemo(() => new Set((favs ?? []).map((f) => f.slug)), [favs]);
  const seenSet = useMemo(() => new Set((history ?? []).map((h) => h.slug)), [history]);

  const rows = data ?? [];
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

  return (
    <section className="px-4 md:px-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight">
          <Crown className="h-5 w-5 text-[color:var(--color-gold)]" />
          Bảng Vàng
          <span className="text-xs font-normal text-muted-foreground">Xếp hạng theo lượt xem</span>
        </h2>
        <div className="flex items-center gap-2">
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
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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

      {/* Podium top 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <AnimatePresence mode="popLayout">
            {podium.map((m) => (
              <motion.div
                layout
                key={`${m.source}-${m.slug}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className={m.rank === 1 ? "md:-mt-3" : ""}
              >
                <Link
                  to="/movie/$slug"
                  params={{ slug: m.slug }}
                  search={{ src: m.source }}
                  className={`group block overflow-hidden rounded-xl border bg-card/70 transition hover:bg-card ${
                    m.rank === 1
                      ? "border-[color:var(--color-gold)]/70 shadow-[0_0_30px_-10px_var(--color-gold)]"
                      : "border-border/60 hover:border-[color:var(--color-gold)]/50"
                  }`}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                    {m.poster && (
                      <img
                        src={m.poster}
                        alt={m.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                    <span
                      className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${
                        m.rank === 1 ? "bg-[color:var(--color-gold)] text-black" : "bg-black/70 text-white"
                      }`}
                    >
                      {m.rank === 1 && <Crown className="h-3 w-3" />}#{m.rank}
                    </span>
                    {seenSet.has(m.slug) && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Đã xem
                      </span>
                    )}
                    <div className="absolute inset-x-2 bottom-2">
                      <div className="line-clamp-2 text-xs font-semibold text-white md:text-sm">{m.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/80">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {m.views}
                        </span>
                        <Delta row={m} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 4 - 10 */}
      {rest.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
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
                      {m.poster && <img src={m.poster} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium group-hover:text-primary">{m.name}</div>
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
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{m.source}</span>
                      </div>
                    </div>
                  </Link>
                  <HeartBtn row={m} isFav={favSet.has(m.slug)} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
