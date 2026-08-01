import { Link, useRouterState } from "@tanstack/react-router";
import { History, Search, Home, Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import { openQuickSearch } from "@/components/QuickSearch";

const items = [
  { to: "/history", label: "Lịch sử", icon: History },
  { to: "/search", label: "Tìm kiếm", icon: Search },
  { to: "/", label: "Trang chủ", icon: Home, primary: true },
  { to: "/favorites", label: "Yêu thích", icon: Heart },
  { to: "/me", label: "Tôi", icon: User },
];

export function DockBar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-auto mx-3 mb-3 flex w-full max-w-md items-end justify-around gap-1 rounded-2xl border border-border bg-card px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="group relative -mt-7 flex flex-col items-center gap-1"
              >
                <motion.span
                  whileTap={{ scale: 0.9 }}
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

          const quick = item.to === "/search" && pathname.startsWith("/watch");
          const inner = (
            <>
              {active && (
                <motion.span
                  layoutId="dock-active"
                  className="absolute inset-0 rounded-xl bg-primary/15"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={`relative h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`relative text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </>
          );

          const cls = "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5";

          return quick ? (
            <button key={item.to} type="button" onClick={openQuickSearch} aria-label={item.label} className={cls}>
              {inner}
            </button>
          ) : (
            <Link key={item.to} to={item.to} aria-label={item.label} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
