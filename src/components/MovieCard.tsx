import { Link } from "@tanstack/react-router";
import type { MovieCard as MC } from "@/lib/types";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Highlight } from "@/components/Highlight";

export function MovieCard({
  movie,
  index = 0,
  highlight,
}: {
  movie: MC;
  index?: number;
  highlight?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.3) }}
      className="group relative shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
    >
      <Link
        to="/movie/$slug"
        params={{ slug: movie.slug }}
        search={{ src: movie.source }}
        className="block"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card ring-1 ring-border/50 transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.05] group-hover:shadow-[0_18px_40px_-12px_hsl(var(--primary)/0.55)] group-hover:ring-2 group-hover:ring-primary group-focus-within:-translate-y-2 group-focus-within:scale-[1.05] group-focus-within:ring-2 group-focus-within:ring-primary">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100">
              <Play className="h-5 w-5 translate-x-[1px] fill-current" />
            </span>
          </div>
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          {movie.quality && (
            <span className="absolute left-2 top-2 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              {movie.quality}
            </span>
          )}
          {movie.lang && (
            <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
              {movie.lang}
            </span>
          )}
          {movie.episode_current && (
            <span className="absolute bottom-2 left-2 right-2 truncate rounded bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 text-[11px] font-medium text-white/90">
              {movie.episode_current}
            </span>
          )}
        </div>
        <div className="mt-2 space-y-0.5">
          <div className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">
            <Highlight text={movie.name} query={highlight} />
          </div>
          {movie.origin_name && (
            <div className="line-clamp-1 text-xs text-muted-foreground">
              <Highlight text={movie.origin_name} query={highlight} />
              {movie.year ? ` · ${movie.year}` : ""}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
