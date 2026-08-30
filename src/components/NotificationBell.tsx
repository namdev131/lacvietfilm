import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEpisodeWatcher, useMarkNotifications, useNotifications } from "@/hooks/useFollows";
import type { SourceId } from "@/lib/types";

export function NotificationBell() {
  const { user } = useAuth();
  const { data, isLoading } = useNotifications();
  const unread = data?.filter((item) => !item.read).length ?? 0;
  const mark = useMarkNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEpisodeWatcher();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (!user) return null;
  const items = (data ?? []).slice(0, 8);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card transition hover:border-primary/60 hover:text-primary ${open ? "border-primary/60 text-primary" : "border-border text-muted-foreground"}`}
      >
        <motion.span animate={unread ? { rotate: [0, -12, 10, -6, 0] } : { rotate: 0 }} transition={{ duration: 0.7, repeat: unread ? Infinity : 0, repeatDelay: 3 }}>
          <Bell className="h-4 w-4" />
        </motion.span>
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Bảng thông báo"
            initial={{ opacity: 0, y: -8, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: .98 }}
            className="fixed inset-x-3 top-16 z-[70] ml-auto max-h-[min(70vh,560px)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px]"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-bold">Thông báo</h2>
              {unread > 0 && <button type="button" onClick={() => mark.mutate({ read: true })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"><CheckCheck className="h-4 w-4" /> Đánh dấu đã đọc</button>}
            </header>
            <div className="max-h-[min(58vh,470px)] overflow-y-auto">
              {isLoading ? <div className="space-y-2 p-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted shimmer" />)}</div>
              : !items.length ? <div className="grid min-h-48 place-items-center px-6 text-center"><div><Bell className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Không có thông báo</p><p className="mt-1 text-xs text-muted-foreground">Thông báo mới sẽ xuất hiện tại đây.</p></div></div>
              : items.map((item) => (
                <Link
                  key={item.id}
                  to={item.slug ? "/watch/$slug" : "/"}
                  params={item.slug ? { slug: item.slug } : undefined}
                  search={item.slug ? { src: (item.source as SourceId) || "kkphim", ep: 0, srv: 0 } : undefined}
                  onClick={() => { if (!item.read) mark.mutate({ id: item.id, read: true }); setOpen(false); }}
                  className={`flex gap-3 border-b border-border/60 p-3 transition hover:bg-muted/60 ${item.read ? "" : "bg-primary/5"}`}
                >
                  {item.poster ? <img src={item.poster} alt="" className="h-16 w-11 shrink-0 rounded object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bell className="h-4 w-4" /></span>}
                  <span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm font-semibold">{item.title}</span>{item.body && <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</span>}<span className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString("vi-VN")}</span></span>
                  {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </Link>
              ))}
            </div>
            <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-3 text-center text-xs font-bold hover:bg-muted/60">Xem tất cả thông báo</Link>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
