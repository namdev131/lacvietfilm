import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  History, Search, Home, Heart, User, Compass, Flame, CalendarClock,
  Library, Bookmark, Settings as SettingsIcon, LogIn, Bell,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ContinueWatching } from "@/components/ContinueWatching";

type MenuLink = { to: string; label: string; icon: typeof Home; desc?: string };

const MENUS: Record<string, { title: string; links: MenuLink[] }> = {
  explore: {
    title: "Khám phá",
    links: [
      { to: "/latest", label: "Phim mới", icon: Flame, desc: "Cập nhật liên tục mỗi ngày" },
      { to: "/browse", label: "Thể loại · Quốc gia", icon: Compass, desc: "Lọc theo thể loại, quốc gia, năm" },
      { to: "/upcoming", label: "Sắp chiếu", icon: CalendarClock, desc: "Phim sắp ra mắt" },
    ],
  },
  library: {
    title: "Yêu thích",
    links: [
      { to: "/favorites", label: "Phim yêu thích", icon: Heart, desc: "Phim bạn đã thả tim" },
      { to: "/collections", label: "Bộ sưu tập", icon: Library, desc: "Playlist tự tạo, chia sẻ link" },
      { to: "/watchlist", label: "Xem sau", icon: Bookmark, desc: "Phim để dành xem sau" },
    ],
  },
  me: {
    title: "Tôi",
    links: [
      { to: "/me", label: "Tài khoản", icon: LogIn, desc: "Đăng nhập / đăng ký / hồ sơ" },
      { to: "/notifications", label: "Thông báo", icon: Bell, desc: "Báo khi phim theo dõi có tập mới" },
      { to: "/settings", label: "Cài đặt", icon: SettingsIcon, desc: "Trình phát, nguồn, giao diện" },
    ],
  },

};

type DockItem = { key: string; to: string; label: string; icon: typeof Home; menu?: keyof typeof MENUS; primary?: boolean };

const items: DockItem[] = [
  { key: "explore", to: "/browse", label: "Khám phá", icon: Compass, menu: "explore" },
  { key: "history", to: "/history", label: "Lịch sử", icon: History },
  { key: "home", to: "/", label: "Trang chủ", icon: Home, primary: true },
  { key: "library", to: "/favorites", label: "Yêu thích", icon: Heart, menu: "library" },
  { key: "me", to: "/me", label: "Tôi", icon: User, menu: "me" },
];

function tap() {
  try { navigator.vibrate?.(8); } catch { /* ignore */ }
}

export function DockBar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => { setOpen(null); }, [pathname]);

  // Ẩn dock khi cuộn xuống, hiện lại khi cuộn lên
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 12) {
        setHidden(y > last && y > 120);
        last = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menu = open ? MENUS[open] : null;

  return (
    <>
      <AnimatePresence>
        {menu && (
          <motion.div
            key="dock-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-[104px] mx-auto w-full max-w-md px-4"
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="border-b border-border/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {menu.title}
                </div>
                <div className="p-2">
                  {menu.links.map((l, i) => {
                    const Icon = l.icon;
                    const active = pathname === l.to || pathname.startsWith(`${l.to}/`);
                    return (
                      <motion.div
                        key={l.to}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i, type: "spring", stiffness: 420, damping: 30 }}
                      >
                      <Link
                        to={l.to}
                        onClick={() => { tap(); setOpen(null); }}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted/60 ${
                          active ? "bg-primary/10" : ""
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm font-semibold ${active ? "text-primary" : ""}`}>{l.label}</span>
                          {l.desc && <span className="block truncate text-xs text-muted-foreground">{l.desc}</span>}
                        </span>
                      </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        animate={{ y: hidden && !menu ? 120 : 0, opacity: hidden && !menu ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]"
      >
        <div className="pointer-events-auto relative mx-3 mb-3 flex w-full max-w-md items-end justify-around gap-1 overflow-hidden rounded-2xl border border-border bg-card px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          {items.map((item) => {
            const group = item.menu ? MENUS[item.menu] : null;
            const active = group
              ? group.links.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`)) || open === item.menu
              : item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-label={item.label}
                  onClick={() => { tap(); setOpen(null); }}
                  className="group relative -mt-7 flex flex-col items-center gap-1"
                >
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.06, rotate: -4 }}
                    animate={active ? { y: [0, -3, 0] } : { y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className={`flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-background transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.6)]"
                        : "bg-secondary text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.span>
                  <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            const inner = (
              <>
                {active && (
                  <motion.span
                    layoutId="dock-active-dot"
                    className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-xl bg-primary/15"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <motion.span
                  className="relative"
                  animate={active ? { y: -2, scale: 1.12 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                >
                  <Icon className={`h-5 w-5 transition ${active ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]" : "text-muted-foreground"}`} />
                </motion.span>
                <span className={`relative text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </>
            );

            const cls = "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5";

            if (group) {
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  aria-label={item.label}
                  aria-expanded={open === item.menu}
                  onClick={() => { tap(); setOpen((o) => (o === item.menu ? null : item.menu ?? null)); }}
                  className={cls}
                >
                  {inner}
                </motion.button>
              );
            }

            return (
              <Link key={item.key} to={item.to} aria-label={item.label} onClick={() => { tap(); setOpen(null); }} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
