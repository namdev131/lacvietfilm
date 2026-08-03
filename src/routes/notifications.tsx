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
  const remove = useDeleteNotifications();
  const unfollow = useUnfollow();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  useEpisodeWatcher();

  if (!loading && !user) {
    return <SignInPrompt title="Thông báo" desc="Đăng nhập để theo dõi phim bộ và nhận báo tập mới." />;
  }

  const items = (data ?? []).filter((n) => (filter === "unread" ? !n.read : true));
  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Bell className="h-6 w-6 text-primary" /> Thông báo
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => mark.mutate({ read: true })}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/60 hover:text-primary"
            >
              <CheckCheck className="h-4 w-4" /> Đọc hết ({unread})
            </button>
          )}
          {!!data?.some((n) => n.read) && (
            <button
              onClick={() =>
                remove.mutate({ onlyRead: true }, { onSuccess: () => toast.success("Đã xoá thông báo đã đọc") })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:border-destructive/60 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Xoá đã đọc
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 inline-flex overflow-hidden rounded-full border border-border">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-semibold transition ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Tất cả" : `Chưa đọc${unread ? ` (${unread})` : ""}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card shimmer" />
          ))}
        </div>
      ) : !items.length ? (
        <p className="mt-10 text-sm text-muted-foreground">
          {filter === "unread"
            ? "Bạn đã đọc hết thông báo."
            : "Chưa có thông báo. Bấm “Thông báo tập mới” ở trang phim bộ để theo dõi nhé."}
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                n.read ? "border-border/60 bg-card/40" : "border-primary/40 bg-primary/5"
              }`}
            >
              <Link
                to={n.slug ? "/watch/$slug" : "/"}
                params={n.slug ? { slug: n.slug } : undefined}
                search={n.slug ? { src: (n.source as SourceId) || "kkphim", ep: 0, srv: 0 } : undefined}
                onClick={() => !n.read && mark.mutate({ id: n.id, read: true })}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {n.poster && <img src={n.poster} alt="" loading="lazy" className="h-16 w-11 rounded object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{n.title}</span>
                  {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => mark.mutate({ id: n.id, read: !n.read })}
                  aria-label={n.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  title={n.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                >
                  {n.read ? <Undo2 className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => remove.mutate({ id: n.id })}
                  aria-label="Xoá thông báo"
                  title="Xoá thông báo"
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
            <div key={f.id} className="group relative">
              <Link
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
              <button
                onClick={() =>
                  unfollow.mutate(f.id, {
                    onSuccess: () => toast.success(`Đã tắt theo dõi “${f.name}”`),
                    onError: () => toast.error("Không tắt được, thử lại nhé"),
                  })
                }
                aria-label={`Tắt theo dõi ${f.name}`}
                title="Tắt theo dõi"
                className="absolute right-1.5 top-1.5 rounded-full bg-background/85 p-1.5 text-muted-foreground backdrop-blur transition hover:text-destructive"
              >
                <BellOff className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
