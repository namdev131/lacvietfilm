import { useState } from "react";
import { MessageCircle, Send, Trash2, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAddComment, useComments, useDeleteComment, type MovieComment } from "@/hooks/useComments";
import type { SourceId } from "@/lib/types";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "vừa xong";
  if (d < 3600) return `${Math.floor(d / 60)} phút trước`;
  if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function CommentsSection({ slug, source }: { slug: string; source: SourceId }) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(slug);
  const add = useAddComment();
  const del = useDeleteComment(slug);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<MovieComment | null>(null);

  const roots = (data ?? []).filter((c) => !c.parent_id);
  const childrenOf = (id: string) => (data ?? []).filter((c) => c.parent_id === id);

  const submit = () => {
    if (!text.trim()) return;
    add.mutate(
      { slug, source, content: text, parentId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText("");
          setReplyTo(null);
        },
        onError: () => toast.error("Không gửi được bình luận"),
      },
    );
  };

  const Item = ({ c, child = false }: { c: MovieComment; child?: boolean }) => (
    <div className={`flex gap-3 ${child ? "ml-8" : ""}`}>
      <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
        {c.avatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{c.author}</span>
          <span>· {timeAgo(c.created_at)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.content}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          {!child && (
            <button type="button" onClick={() => setReplyTo(c)} className="hover:text-primary">
              Trả lời
            </button>
          )}
          {user?.id === c.user_id && (
            <button
              type="button"
              onClick={() => del.mutate(c.id)}
              className="inline-flex items-center gap-1 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5 text-primary" /> Bình luận
        <span className="text-sm font-normal text-muted-foreground">({data?.length ?? 0})</span>
      </h2>

      {user ? (
        <div className="mt-4 rounded-xl border border-border/70 bg-card/70 p-3">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CornerDownRight className="h-3.5 w-3.5" /> Đang trả lời {replyTo.author}
              <button onClick={() => setReplyTo(null)} className="text-primary">
                huỷ
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Chia sẻ cảm nhận của bạn về phim…"
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submit}
              disabled={add.isPending || !text.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Gửi
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary">
            Đăng nhập
          </Link>{" "}
          để bình luận về phim này.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {isLoading && <div className="h-16 rounded-lg bg-card shimmer" />}
        {!isLoading && roots.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
        {roots.map((c) => (
          <div key={c.id} className="space-y-3">
            <Item c={c} />
            {childrenOf(c.id).map((r) => (
              <Item key={r.id} c={r} child />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
