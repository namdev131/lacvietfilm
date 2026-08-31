import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  History, Home, Heart, User, Compass, Flame, CalendarClock,
  Library, Bookmark, Settings as SettingsIcon, LogIn, Bell, Mail, Users,
  PanelLeftClose, PanelLeftOpen, Pin,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

type DockItem = { key: string; to?: string; label: string; icon: typeof Home; menu?: keyof typeof MENUS; action?: "social"; primary?: boolean };

const items: DockItem[] = [
  { key: "explore", to: "/browse", label: "Khám phá", icon: Compass, menu: "explore" },
  { key: "history", to: "/history", label: "Lịch sử", icon: History },
  { key: "contact", to: "/contact", label: "Liên hệ", icon: Mail },
  { key: "home", to: "/", label: "Trang chủ", icon: Home, primary: true },
  { key: "social", label: "Xã hội", icon: Users, action: "social" },
  { key: "library", to: "/favorites", label: "Yêu thích", icon: Heart, menu: "library" },
  { key: "me", to: "/me", label: "Tôi", icon: User, menu: "me" },
];

type DesktopDockMode = "shown" | "auto" | "hidden";
const DESKTOP_DOCK_MODE_KEY = "lv-desktop-dock-mode";

function tap() {
  try { navigator.vibrate?.(8); } catch { /* ignore */ }
}

export function DockBar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState<string | null>(null);
  const [panel, setPanel] = useState<"social" | null>(null);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktopMode, setDesktopMode] = useState<DesktopDockMode>("shown");
  const [desktopHovered, setDesktopHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DESKTOP_DOCK_MODE_KEY);
    if (saved === "shown" || saved === "auto" || saved === "hidden") setDesktopMode(saved);
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(DESKTOP_DOCK_MODE_KEY, desktopMode);
    document.documentElement.dataset.desktopDock = desktopMode;
    return () => { delete document.documentElement.dataset.desktopDock; };
  }, [desktopMode, mounted]);
  useEffect(() => { setOpen(null); }, [pathname]);

  // Chỉ tự ẩn bottom bar trên mobile.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      if (window.innerWidth >= 1024) {
        setHidden(false);
        return;
      }
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

  if (!mounted) return null;


  return createPortal(
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
              className="dock-menu-position absolute inset-x-0 bottom-[104px] mx-auto w-full max-w-md px-4"
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

      <AnimatePresence>
        {panel && (
          <motion.div
            key="dock-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Xã hội"
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            >
              <div className="text-center">
                <Users className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-xl font-black">Xã hội</h2>
                <p className="mt-2 text-sm text-muted-foreground">Tính năng đang phát triển.</p>
                <button type="button" onClick={() => setPanel(null)} className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Đã hiểu</button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        data-dockbar
        data-desktop-mode={desktopMode}
        data-desktop-open={desktopHovered || Boolean(menu) ? "true" : "false"}
        aria-label="Điều hướng chính"
        onMouseEnter={() => setDesktopHovered(true)}
        onMouseLeave={() => { if (!menu) setDesktopHovered(false); }}
        animate={{ y: hidden && !menu ? 120 : 0, opacity: hidden && !menu ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="dock-shell fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]"
      >
        <div className="dock-bar pointer-events-auto relative mx-2 mb-3 grid w-full max-w-lg grid-cols-7 items-end gap-0.5 border border-border bg-card px-1.5 pb-2 pt-2">
          {items.map((item) => {
            const group = item.menu ? MENUS[item.menu] : null;
            const active = item.action ? panel === item.action : group
              ? group.links.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`)) || open === item.menu
              : item.to === "/"
                ? pathname === "/"
                : Boolean(item.to && pathname.startsWith(item.to));
            const Icon = item.icon;

            if (item.primary && item.to) {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-label={item.label}
                  onClick={() => { tap(); setOpen(null); }}
                  className="dock-item dock-home group relative -mt-7 flex min-w-0 flex-col items-center gap-1"
                >
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.06, rotate: -4 }}
                    animate={active ? { y: [0, -3, 0] } : { y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`dock-home-icon flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-background transition ${
                      active
                        ? "bg-primary text-primary-foreground"
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
                  <Icon className={`h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`} />
                </motion.span>
                <span className={`relative text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </>
            );

            const cls = "dock-item relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5";

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

            if (item.action) {
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  aria-label={item.label}
                  onClick={() => { tap(); setOpen(null); setPanel(item.action ?? null); }}
                  className={cls}
                >
                  {inner}
                </motion.button>
              );
            }

            return item.to ? (
              <Link key={item.key} to={item.to} aria-label={item.label} onClick={() => { tap(); setOpen(null); }} className={cls}>
                {inner}
              </Link>
            ) : null;
          })}
        </div>
        <div className="desktop-dock-controls" aria-label="Tùy chọn thanh điều hướng">
          <button type="button" aria-pressed={desktopMode === "auto"} title={desktopMode === "auto" ? "Tắt tự ẩn" : "Tự động ẩn"} onClick={() => setDesktopMode((mode) => mode === "auto" ? "shown" : "auto")}>
            <Pin className="h-4 w-4" /><span>Auto</span>
          </button>
          <button type="button" title="Ẩn thanh điều hướng" onClick={() => setDesktopMode("hidden")}>
            <PanelLeftClose className="h-4 w-4" /><span>Ẩn</span>
          </button>
        </div>
        <button type="button" className="desktop-dock-reveal" aria-label="Hiện thanh điều hướng" title="Hiện thanh điều hướng" onClick={() => setDesktopMode("shown")}>
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <span className="desktop-dock-edge" aria-hidden="true" />
      </motion.nav>
    </>,
    document.body,
  );
}