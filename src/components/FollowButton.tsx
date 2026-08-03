import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollows";
import type { SourceId } from "@/lib/types";

export function FollowButton({
  slug,
  name,
  poster,
  source,
  episodes,
  compact = false,
}: {
  slug: string;
  name: string;
  poster?: string;
  source: SourceId;
  episodes: number;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const following = useIsFollowing(slug);
  const toggle = useToggleFollow();
  const navigate = useNavigate();

  const Icon = toggle.isPending ? Loader2 : following ? BellRing : Bell;

  return (
    <button
      onClick={() => {
        if (!user) {
          toast.info("Đăng nhập để nhận thông báo tập mới");
          navigate({ to: "/auth" });
          return;
        }
        toggle.mutate(
          { slug, name, poster, source, episodes, following },
          {
            onSuccess: () =>
              toast.success(following ? "Đã tắt thông báo phim này" : "Sẽ báo bạn khi có tập mới"),
            onError: () => toast.error("Không lưu được, thử lại nhé"),
          },
        );
      }}
      aria-label={following ? "Tắt thông báo tập mới" : "Nhận thông báo tập mới"}
      className={
        compact
          ? `rounded-full p-2 transition ${following ? "bg-primary/20 text-primary" : "bg-background/80 text-foreground hover:text-primary"}`
          : `inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition ${
              following ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/60"
            }`
      }
    >
      <Icon className={`h-4 w-4 ${toggle.isPending ? "animate-spin" : ""}`} />
      {!compact && (following ? "Đang theo dõi" : "Thông báo tập mới")}
    </button>
  );
}
