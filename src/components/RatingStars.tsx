import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRateMovie, useRating } from "@/hooks/useRatings";
import type { SourceId } from "@/lib/types";

export function RatingStars({
  slug,
  name,
  poster,
  source,
}: {
  slug: string;
  name: string;
  poster?: string;
  source: SourceId;
}) {
  const { user } = useAuth();
  const { data } = useRating(slug);
  const rate = useRateMovie();
  const navigate = useNavigate();
  const [hover, setHover] = useState(0);

  const value = hover || data?.mine || 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-primary">
            {data?.count ? data.avg.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {data?.count ? `${data.count} lượt đánh giá` : "Chưa có đánh giá"}
        </div>
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 10 }).map((_, i) => {
            const score = i + 1;
            return (
              <button
                key={score}
                type="button"
                aria-label={`Chấm ${score} sao`}
                onMouseEnter={() => setHover(score)}
                onClick={() => {
                  if (!user) {
                    toast.info("Đăng nhập để đánh giá phim");
                    navigate({ to: "/auth" });
                    return;
                  }
                  rate.mutate(
                    { slug, name, poster, source, score },
                    {
                      onSuccess: () => toast.success(`Đã chấm ${score}/10`),
                      onError: () => toast.error("Không lưu được đánh giá"),
                    },
                  );
                }}
                className="p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Star
                  className={`h-5 w-5 ${
                    score <= value ? "fill-primary text-primary" : "text-muted-foreground/50"
                  }`}
                />
              </button>
            );
          })}
        </div>
        {data?.mine ? (
          <span className="text-xs text-muted-foreground">Bạn đã chấm {data.mine}/10</span>
        ) : null}
      </div>
    </div>
  );
}
