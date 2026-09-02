import { useEffect, useState } from "react";
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
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    setScore(data?.mine?.score ?? 0);
    setReview(data?.mine?.review ?? "");
  }, [slug, data?.mine]);

  const submit = () => {
    if (!user) {
      toast.info("Đăng nhập để đánh giá phim");
      navigate({ to: "/auth" });
      return;
    }
    if (!score) return toast.info("Hãy chọn từ 1 đến 5 sao");
    rate.mutate(
      { slug, name, poster, source, score, review },
      {
        onSuccess: () => toast.success(data?.mine ? "Đã cập nhật đánh giá" : "Đã gửi đánh giá"),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/70 p-4"
      aria-label="Đánh giá phim"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-primary">
            {data?.count ? data.avg.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">/5</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {data?.count ? `${data.count} lượt đánh giá` : "Chưa có đánh giá"}
        </span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                aria-label={`Chấm ${value} sao`}
                onMouseEnter={() => setHover(value)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(0)}
                onClick={() => setScore(value)}
                className="rounded p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Star
                  className={`h-6 w-6 ${value <= (hover || score) ? "fill-primary text-primary" : "text-muted-foreground/50"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={review}
        onChange={(event) => setReview(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Nhận xét về phim (không bắt buộc)"
        aria-label="Nhận xét về phim"
        className="mt-4 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{review.length}/1000</span>
        <button
          type="button"
          disabled={rate.isPending}
          onClick={submit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {rate.isPending ? "Đang lưu…" : data?.mine ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <h3 className="font-semibold">Đánh giá mới nhất</h3>
        {data?.reviews.length ? (
          <div className="mt-3 space-y-3">
            {data.reviews.map((item) => (
              <article
                key={`${item.user_id}-${item.updated_at}`}
                className="rounded-md bg-background/70 p-3"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <strong>{item.user_id === user?.id ? "Bạn" : item.display_name}</strong>
                  <span className="text-primary">{item.score}/5 sao</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {item.review}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Chưa có nhận xét.</p>
        )}
      </div>
    </section>
  );
}
