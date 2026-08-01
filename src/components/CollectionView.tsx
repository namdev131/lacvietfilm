import { Link } from "@tanstack/react-router";
import { Globe, Lock, Play, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRemoveCollectionItem, type Collection, type CollectionItem } from "@/hooks/useCollections";
import type { SourceId } from "@/lib/types";

export function CollectionView({
  collection,
  items,
}: {
  collection: Collection;
  items: CollectionItem[];
}) {
  const { user } = useAuth();
  const remove = useRemoveCollectionItem();
  const isOwner = user?.id === collection.user_id;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-10 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{collection.title}</h1>
          {collection.description && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
          )}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {collection.is_public ? (
              <Globe className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {collection.is_public ? "Bộ sưu tập công khai" : "Riêng tư"} · {items.length} phim
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/c/${collection.share_code}`);
            toast.success("Đã sao chép link chia sẻ");
          }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:border-primary"
        >
          <Share2 className="h-4 w-4" /> Chia sẻ
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Bộ sưu tập chưa có phim nào.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((it) => (
            <div key={it.id} className="group relative">
              <Link
                to="/movie/$slug"
                params={{ slug: it.slug }}
                search={{ src: it.source as SourceId }}
                className="block"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card ring-1 ring-border/50 transition group-hover:ring-2 group-hover:ring-primary">
                  {it.poster ? (
                    <img src={it.poster} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                </div>
                <div className="mt-2 line-clamp-1 text-sm font-medium">{it.name}</div>
              </Link>
              {isOwner && (
                <button
                  onClick={() => remove.mutate(it.id)}
                  aria-label="Xoá khỏi bộ sưu tập"
                  className="absolute right-2 top-2 rounded-full bg-background/85 p-2 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
