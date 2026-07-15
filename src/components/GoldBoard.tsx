import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { fetchLatest } from "@/lib/api";
import type { MovieCard as MC } from "@/lib/types";
import { Crown, Radio } from "lucide-react";

export function GoldBoard() {
  const [items, setItems] = useState<MC[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([fetchLatest("kkphim", 1), fetchLatest("ophim", 1)]);
        if (!alive) return;
        const merged = [...a, ...b]
          .filter((m) => m.poster)
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        setItems(merged);
      } catch {}
    };
    load();
    const t = setInterval(() => {
      setTick((x) => x + 1);
      load();
    }, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="px-4 md:px-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight">
          <Crown className="h-5 w-5 text-[color:var(--color-gold)]" />
          Bảng Vàng
          <span className="text-xs font-normal text-muted-foreground">Xếp hạng thịnh hành</span>
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
          <Radio className="h-3 w-3 animate-pulse text-primary" />
          Thời gian thực
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {items.slice(0, 10).map((m, i) => (
            <motion.div
              layout
              key={`${m.source}-${m.slug}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
            >
              <Link
                to="/movie/$slug"
                params={{ slug: m.slug }}
                search={{ src: m.source }}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/70 p-2 pr-4 transition hover:border-[color:var(--color-gold)]/60 hover:bg-card"
              >
                <span
                  className={`w-8 shrink-0 text-center font-black tabular-nums ${
                    i < 3 ? "text-3xl text-[color:var(--color-gold)]" : "text-xl text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {m.poster && <img src={m.poster} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                    {m.name}
                  </div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {m.origin_name} {m.year ? `· ${m.year}` : ""}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {m.quality && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {m.quality}
                      </span>
                    )}
                    {m.lang && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {m.lang}
                      </span>
                    )}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                      {m.source}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        {!items.length && (
          <div className="col-span-full grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-card/60 shimmer" />
            ))}
          </div>
        )}
      </div>
      <div className="sr-only">tick:{tick}</div>
    </section>
  );
}
