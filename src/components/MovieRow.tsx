import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { MovieCard as MC } from "@/lib/types";

export function MovieRow({
  title,
  movies,
  accent,
}: {
  title: string;
  movies: MC[];
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, movies.length]);

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  };

  if (!movies.length) return null;

  const btn =
    "absolute top-1/2 z-20 hidden h-16 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-lg transition hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <section className="relative">
      <div className="mb-3 flex items-baseline justify-between px-4 md:px-10">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          {title}
          {accent && <span className="ml-2 text-xs text-muted-foreground">{accent}</span>}
        </h2>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Cuộn sang trái"
          onClick={() => scroll(-1)}
          disabled={atStart}
          className={`${btn} left-1 md:left-2`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div
          ref={ref}
          tabIndex={0}
          className="scroll-row flex gap-3 overflow-x-auto scroll-smooth px-4 pb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:gap-4 md:px-14"
        >
          {movies.map((m, i) => (
            <MovieCard key={`${m.source}-${m.slug}-${i}`} movie={m} index={i} />
          ))}
        </div>
        <button
          type="button"
          aria-label="Cuộn sang phải"
          onClick={() => scroll(1)}
          disabled={atEnd}
          className={`${btn} right-1 md:right-2`}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}
