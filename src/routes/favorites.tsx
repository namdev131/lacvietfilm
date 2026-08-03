import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useUserData";
import { SignInPrompt } from "@/components/SignInPrompt";
import type { SourceId } from "@/lib/types";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Phim yêu thích | Lạc Việt Cinema" },
      { name: "description", content: "Danh sách phim bạn đã lưu để xem sau trên Lạc Việt Cinema." },
      { property: "og:title", content: "Phim yêu thích — Lạc Việt Cinema" },
      { property: "og:description", content: "Danh sách phim bạn đã lưu để xem sau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useFavorites();
  const qc = useQueryClient();

  if (!loading && !user) {
    return <SignInPrompt title="Danh sách yêu thích" desc="Đăng nhập để lưu và đồng bộ phim yêu thích của bạn." />;
  }

  async function remove(slug: string) {
    await supabase.from("favorites").delete().eq("slug", slug);
    qc.invalidateQueries({ queryKey: ["favorites"] });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-10 md:px-10">
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
        <Heart className="h-6 w-6 text-primary" /> Yêu thích
      </h1>

      {isLoading || loading ? (
        <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-lg bg-card shimmer" />)}
        </div>
      ) : !data?.length ? (
        <p className="mt-10 text-sm text-muted-foreground">Chưa có phim nào. Bấm ♥ ở trang phim để lưu lại nhé.</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
          {data.map((m) => (
            <div key={m.slug} className="group relative">
              <Link
                to="/movie/$slug"
                params={{ slug: m.slug }}
                search={{ src: (m.source as SourceId) || "kkphim" }}
                className="block overflow-hidden rounded-lg ring-1 ring-border/60"
              >
                <img src={m.poster ?? ""} alt={m.name} loading="lazy" className="aspect-[2/3] w-full object-cover transition group-hover:scale-105" />
              </Link>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{m.name}</p>
              <button
                onClick={() => remove(m.slug)}
                aria-label="Xoá khỏi yêu thích"
                className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1.5 opacity-0 transition group-hover:opacity-100 hover:text-primary"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
