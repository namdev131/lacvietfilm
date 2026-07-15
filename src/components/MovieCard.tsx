import { Link } from "@tanstack/react-router";
import type { MovieCard as MC } from "@/lib/types";
import { motion } from "framer-motion";

export function MovieCard({ movie, index = 0 }: { movie: MC; index?: number }) {
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
        <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-[1.04] group-hover:ring-primary/60">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.name}
              loading="lazy"
              className="h-full w-full object-cover"
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
            {movie.name}
          </div>
          {movie.origin_name && (
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {movie.origin_name}
              {movie.year ? ` · ${movie.year}` : ""}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
