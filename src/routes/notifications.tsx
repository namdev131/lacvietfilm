import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  useDeleteNotifications,
  useEpisodeWatcher,
  useFollows,
  useMarkNotifications,
  useNotifications,
  useUnfollow,
} from "@/hooks/useFollows";
import type { SourceId } from "@/lib/types";


export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Thông báo tập mới | Lạc Việt Cinema" },
      { name: "description", content: "Theo dõi phim bộ yêu thích và nhận thông báo ngay khi có tập mới trên Lạc Việt Cinema." },
      { property: "og:title", content: "Thông báo — Lạc Việt Cinema" },
      { property: "og:description", content: "Nhận thông báo ngay khi phim bạn theo dõi có tập mới." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useNotifications();
  const { data: follows } = useFollows();
  const mark = useMarkNotifications();
  useEpisodeWatcher();

  if (!loading && !user) {
    return <SignInPrompt title="Thông báo" desc="Đăng nhập để theo dõi phim bộ và nhận báo tập mới." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Bell className="h-6 w-6 text-primary" /> Thông báo
        </h1>
        {!!data?.some((n) => !n.read) && (
          <button
            onClick={() => mark.mutate(undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/60 hover:text-primary"
          >
            <CheckCheck className="h-4 w-4" /> Đánh dấu đã đọc
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card shimmer" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Chưa có thông báo. Bấm “Thông báo tập mới” ở trang phim bộ để theo dõi nhé.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {data.map((n) => (
            <li key={n.id}>
              <Link
                to={n.slug ? "/watch/$slug" : "/"}
                params={n.slug ? { slug: n.slug } : undefined}
                search={n.slug ? { src: (n.source as SourceId) || "kkphim", ep: 0, srv: 0 } : undefined}
                onClick={() => !n.read && mark.mutate(n.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-primary/60 ${
                  n.read ? "border-border/60 bg-card/40" : "border-primary/40 bg-primary/5"
                }`}
              >
                {n.poster && <img src={n.poster} alt="" loading="lazy" className="h-16 w-11 rounded object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{n.title}</span>
                  {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </span>
                </span>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-muted-foreground">Đang theo dõi</h2>
      {!follows?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">Bạn chưa theo dõi phim bộ nào.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
          {follows.map((f) => (
            <Link
              key={f.id}
              to="/movie/$slug"
              params={{ slug: f.slug }}
              search={{ src: (f.source as SourceId) || "kkphim" }}
              className="block"
            >
              <img
                src={f.poster ?? ""}
                alt={f.name}
                loading="lazy"
                className="aspect-[2/3] w-full rounded-lg object-cover ring-1 ring-border/60"
              />
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{f.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
