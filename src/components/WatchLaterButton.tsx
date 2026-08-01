import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useInWatchlist, useToggleWatchlist } from "@/hooks/useWatchlist";
import type { SourceId } from "@/lib/types";

export function WatchLaterButton({
  slug,
  name,
  poster,
  source,
  compact = false,
}: {
  slug: string;
  name: string;
  poster?: string;
  source: SourceId;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const inList = useInWatchlist(slug);
  const toggle = useToggleWatchlist();
  const navigate = useNavigate();

  const Icon = toggle.isPending ? Loader2 : inList ? BookmarkCheck : Bookmark;

  return (
    <button
      onClick={() => {
        if (!user) {
          toast.info("Đăng nhập để lưu phim vào danh sách Xem sau");
          navigate({ to: "/auth" });
          return;
        }
        toggle.mutate(
          { slug, name, poster, source, inList },
          {
            onSuccess: () => toast.success(inList ? "Đã bỏ khỏi Xem sau" : "Đã thêm vào Xem sau"),
            onError: () => toast.error("Không lưu được, thử lại nhé"),
          },
        );
      }}
      aria-label={inList ? "Bỏ khỏi Xem sau" : "Thêm vào Xem sau"}
      className={
        compact
          ? `rounded-full p-2 transition ${inList ? "bg-primary/20 text-primary" : "bg-background/80 text-foreground hover:text-primary"}`
          : `inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition ${
              inList
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-foreground hover:border-primary/60"
            }`
      }
    >
      <Icon className={`h-4 w-4 ${toggle.isPending ? "animate-spin" : ""}`} />
      {!compact && (inList ? "Đã lưu xem sau" : "Xem sau")}
    </button>
  );
}
