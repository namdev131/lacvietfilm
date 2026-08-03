import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Library, Plus, Globe, Lock, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  useCreateCollection,
  useDeleteCollection,
  useMyCollections,
  useUpdateCollection,
} from "@/hooks/useCollections";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Bộ sưu tập phim của bạn | Lạc Việt Cinema" },
      {
        name: "description",
        content: "Tạo playlist phim theo ý thích, đặt công khai và chia sẻ link cho bạn bè.",
      },
      { property: "og:title", content: "Bộ sưu tập — Lạc Việt Cinema" },
      { property: "og:description", content: "Playlist phim tự tạo, chia sẻ link công khai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lacvietcinema.lovable.app/collections" },
    ],
    links: [{ rel: "canonical", href: "https://lacvietcinema.lovable.app/collections" }],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useMyCollections();
  const create = useCreateCollection();
  const update = useUpdateCollection();
  const del = useDeleteCollection();
  const [title, setTitle] = useState("");

  if (!loading && !user) {
    return <SignInPrompt title="Bộ sưu tập" desc="Đăng nhập để tạo playlist phim và chia sẻ với bạn bè." />;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-10 md:px-10">
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
        <Library className="h-6 w-6 text-primary" /> Bộ sưu tập
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Tự tạo playlist phim và chia sẻ link công khai.</p>

      <div className="mt-5 flex max-w-lg gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên bộ sưu tập mới…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={!title.trim() || create.isPending}
          onClick={() =>
            create.mutate(
              { title },
              { onSuccess: () => setTitle(""), onError: () => toast.error("Không tạo được") },
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Tạo
        </button>
      </div>

      {isLoading ? (
        <div className="mt-8 h-24 rounded-xl bg-card shimmer" />
      ) : (data?.length ?? 0) === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Chưa có bộ sưu tập nào.</p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/70 bg-card/70 p-4">
              <Link
                to="/collections/$id"
                params={{ id: c.id }}
                className="text-base font-bold hover:text-primary"
              >
                {c.title}
              </Link>
              {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => update.mutate({ id: c.id, is_public: !c.is_public })}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                    c.is_public ? "border-primary/60 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {c.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {c.is_public ? "Công khai" : "Riêng tư"}
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/c/${c.share_code}`;
                    navigator.clipboard?.writeText(url);
                    toast.success(c.is_public ? "Đã sao chép link chia sẻ" : "Đã sao chép link — nhớ bật Công khai");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ
                </button>
                <button
                  onClick={() => del.mutate(c.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
