import { useState } from "react";
import { ListPlus, Plus, Check, Loader2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCollection, useCreateCollection, useMyCollections } from "@/hooks/useCollections";
import type { SourceId } from "@/lib/types";

export function AddToCollectionButton({
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { data: collections, isLoading } = useMyCollections();
  const create = useCreateCollection();
  const add = useAddToCollection();
  const [added, setAdded] = useState<string[]>([]);

  const addTo = (collectionId: string) =>
    add.mutate(
      { collectionId, slug, name, poster, source },
      {
        onSuccess: () => {
          setAdded((a) => [...a, collectionId]);
          toast.success("Đã thêm vào bộ sưu tập");
        },
        onError: () => toast.error("Không thêm được"),
      },
    );

  return (
    <>
      <button
        onClick={() => {
          if (!user) {
            toast.info("Đăng nhập để tạo bộ sưu tập");
            navigate({ to: "/auth" });
            return;
          }
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition hover:border-primary/60"
      >
        <ListPlus className="h-4 w-4" /> Bộ sưu tập
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold">Thêm “{name}” vào bộ sưu tập</h3>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {isLoading && <div className="h-10 rounded bg-muted shimmer" />}
              {!isLoading && (collections?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Bạn chưa có bộ sưu tập nào.</p>
              )}
              {collections?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addTo(c.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary"
                >
                  <span className="flex items-center gap-2">
                    {c.is_public ? (
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {c.title}
                  </span>
                  {added.includes(c.id) ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : add.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên bộ sưu tập mới…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                disabled={!title.trim() || create.isPending}
                onClick={() =>
                  create.mutate(
                    { title },
                    {
                      onSuccess: (d) => {
                        setTitle("");
                        if (d?.id) addTo(d.id);
                      },
                      onError: () => toast.error("Không tạo được bộ sưu tập"),
                    },
                  )
                }
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Tạo
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
