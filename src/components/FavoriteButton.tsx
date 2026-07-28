import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useUserData";
import type { SourceId } from "@/lib/types";

export function FavoriteButton({
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
  const isFav = useIsFavorite(slug);
  const toggle = useToggleFavorite();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        if (!user) {
          toast.info("Đăng nhập để lưu phim yêu thích");
          navigate({ to: "/auth" });
          return;
        }
        toggle.mutate(
          { slug, name, poster, source, isFav },
          {
            onSuccess: () => toast.success(isFav ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích"),
            onError: () => toast.error("Không lưu được, thử lại nhé"),
          },
        );
      }}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition ${
        isFav ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/60"
      }`}
    >
      {toggle.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
      )}
      {isFav ? "Đã thích" : "Yêu thích"}
    </button>
  );
}
