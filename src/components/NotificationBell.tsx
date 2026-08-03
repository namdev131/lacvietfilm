import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEpisodeWatcher, useUnreadCount } from "@/hooks/useFollows";

export function NotificationBell() {
  const { user } = useAuth();
  const unread = useUnreadCount();
  useEpisodeWatcher();

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      aria-label={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary"
      activeProps={{ className: "border-primary/60 text-primary" }}
    >
      <motion.span animate={unread ? { rotate: [0, -12, 10, -6, 0] } : { rotate: 0 }} transition={{ duration: 0.7, repeat: unread ? Infinity : 0, repeatDelay: 3 }}>
        <Bell className="h-4 w-4" />
      </motion.span>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
