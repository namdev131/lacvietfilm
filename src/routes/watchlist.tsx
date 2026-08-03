import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRemoveFromWatchlist, useWatchlist } from "@/hooks/useWatchlist";
import { SignInPrompt } from "@/components/SignInPrompt";
import type { SourceId } from "@/lib/types";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Xem sau | Lạc Việt Cinema" },
      {
        name: "description",
        content: "Danh sách Xem sau: lưu phim để xem khi rảnh, đồng bộ trên mọi thiết bị của bạn.",
      },
      { property: "og:title", content: "Xem sau — Lạc Việt Cinema" },
      { property: "og:description", content: "Lưu phim để xem khi rảnh, đồng bộ trên mọi thiết bị." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lacvietcinema.lovable.app/watchlist" },
    ],
    links: [{ rel: "canonical", href: "https://lacvietcinema.lovable.app/watchlist" }],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useWatchlist();
  const remove = useRemoveFromWatchlist();

  if (!loading && !user) {
    return <SignInPrompt title="Danh sách Xem sau" desc="Đăng nhập để lưu phim xem sau và đồng bộ giữa các thiết bị." />;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-10 md:px-10">
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
        <Bookmark className="h-6 w-6 text-primary" /> Xem sau
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Phim bạn để dành, đồng bộ trên mọi thiết bị.</p>

      {isLoading || loading ? (
        <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-card shimmer" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Chưa có phim nào. Bấm nút “Xem sau” ở trang phim để để dành nhé.
        </p>
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
                <img
                  src={m.poster ?? ""}
                  alt={m.name}
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover transition group-hover:scale-105"
                />
              </Link>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{m.name}</p>
              <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100">
                <Link
                  to="/watch/$slug"
                  params={{ slug: m.slug }}
                  search={{ src: (m.source as SourceId) || "kkphim" }}
                  aria-label="Xem ngay"
                  className="rounded-full bg-primary p-1.5 text-primary-foreground"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
                <button
                  onClick={() => remove.mutate(m.slug)}
                  aria-label="Xoá khỏi Xem sau"
                  className="rounded-full bg-background/85 p-1.5 hover:text-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
