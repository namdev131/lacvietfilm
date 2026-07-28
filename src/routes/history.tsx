import { createFileRoute, Link } from "@tanstack/react-router";
import { History as HistoryIcon, Trash2, Play } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHistory } from "@/hooks/useUserData";
import { SignInPrompt } from "@/components/SignInPrompt";
import type { SourceId } from "@/lib/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Lịch sử xem | Lạc Việt Cinema" },
      { name: "description", content: "Xem lại các bộ phim và tập phim bạn đã theo dõi gần đây trên Lạc Việt Cinema." },
      { property: "og:title", content: "Lịch sử xem — Lạc Việt Cinema" },
      { property: "og:description", content: "Xem tiếp những tập phim bạn đang theo dõi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useHistory();
  const qc = useQueryClient();

  if (!loading && !user) {
    return <SignInPrompt title="Lịch sử xem" desc="Đăng nhập để lưu lại tiến độ xem phim trên mọi thiết bị." />;
  }

  async function clearAll() {
    await supabase.from("watch_history").delete().not("slug", "is", null);
    qc.invalidateQueries({ queryKey: ["history"] });
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-32 pt-10 md:px-10">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <HistoryIcon className="h-6 w-6 text-primary" /> Lịch sử xem
        </h1>
        {!!data?.length && (
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/60 hover:text-primary">
            <Trash2 className="h-3.5 w-3.5" /> Xoá tất cả
          </button>
        )}
      </div>

      {isLoading || loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-card shimmer" />)}
        </div>
      ) : !data?.length ? (
        <p className="mt-10 text-sm text-muted-foreground">Chưa có lịch sử. Hãy bắt đầu xem một bộ phim nhé!</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((m) => (
            <li key={m.slug} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-2.5">
              <img src={m.poster ?? ""} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.episode_name ? `Đang xem ${m.episode_name}` : "Đã xem"}
                  {m.watched_at ? ` · ${new Date(m.watched_at).toLocaleDateString("vi-VN")}` : ""}
                </p>
              </div>
              <Link
                to="/watch/$slug"
                params={{ slug: m.slug }}
                search={{ src: (m.source as SourceId) || "kkphim", ep: 0, srv: 0 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-3.5 w-3.5" /> Xem tiếp
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
