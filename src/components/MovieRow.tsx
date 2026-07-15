import { useRef } from "react";
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
  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  };
  if (!movies.length) return null;
  return (
    <section className="relative">
      <div className="mb-3 flex items-baseline justify-between px-4 md:px-10">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          {title}
          {accent && <span className="ml-2 text-xs text-muted-foreground">{accent}</span>}
        </h2>
      </div>
      <div className="group relative">
        <button
          aria-label="Trước"
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={ref}
          className="scroll-row flex gap-3 overflow-x-auto scroll-smooth px-4 pb-6 md:gap-4 md:px-10"
        >
          {movies.map((m, i) => (
            <MovieCard key={`${m.source}-${m.slug}-${i}`} movie={m} index={i} />
          ))}
        </div>
        <button
          aria-label="Sau"
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
