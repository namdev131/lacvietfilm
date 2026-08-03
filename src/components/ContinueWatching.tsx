import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { useHistory } from "@/hooks/useUserData";
import {
  formatTime,
  getLatestUnfinishedProgress,
  isFinished,
  progressPercent,
  slugToTitle,
} from "@/lib/progress";
import type { SourceId } from "@/lib/types";

const DISMISS_KEY = "lv-continue-dismissed";

interface Resume {
  slug: string;
  name: string;
  poster: string | null;
  source: SourceId;
  ep: number;
  srv: number;
  position: number;
  duration: number;
  episodeName?: string | null;
}

/** Thanh "Tiếp tục xem" thông minh, nổi ngay trên DockBar */
export function ContinueWatching() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: history } = useHistory();
  const [local, setLocal] = useState<Resume | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY));
    const p = getLatestUnfinishedProgress();
    setLocal(
      p
        ? {
            slug: p.slug,
            name: slugToTitle(p.slug),
            poster: null,
            source: p.source as SourceId,
            ep: p.ep,
            srv: p.srv,
            position: p.position,
            duration: p.duration,
          }
        : null,
    );
  }, [pathname]);

  const resume = useMemo<Resume | null>(() => {
    const cloud = (history ?? []).find(
      (h) =>
        !h.finished &&
        (h.position_seconds ?? 0) > 30 &&
        !isFinished(h.position_seconds ?? 0, h.duration_seconds ?? 0),
    );
    if (cloud) {
      return {
        slug: cloud.slug,
        name: cloud.name,
        poster: cloud.poster,
        source: cloud.source as SourceId,
        ep: cloud.ep_index ?? 0,
        srv: cloud.srv_index ?? 0,
        position: cloud.position_seconds ?? 0,
        duration: cloud.duration_seconds ?? 0,
        episodeName: cloud.episode_name,
      };
    }
    return local;
  }, [history, local]);

  // Không hiện khi đang ở trang xem / phòng xem chung, hoặc đã tắt trong phiên này
  const hide =
    !resume ||
    pathname.startsWith("/watch") ||
    pathname.startsWith("/party") ||
    dismissed === `${resume?.source}:${resume?.slug}:${resume?.ep}`;

  const pct = resume ? progressPercent(resume.position, resume.duration) : 0;

  return (
    <AnimatePresence>
      {!hide && resume && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="pointer-events-none fixed inset-x-0 bottom-[86px] z-40 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2 pr-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {resume.poster ? (
              <img
                src={resume.poster}
                alt={`Poster ${resume.name}`}
                loading="lazy"
                className="h-12 w-9 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Play className="h-4 w-4" />
              </span>
            )}
            <Link
              to="/watch/$slug"
              params={{ slug: resume.slug }}
              search={{ src: resume.source, ep: resume.ep, srv: resume.srv }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-sm font-bold">{resume.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {resume.episodeName || `Tập ${resume.ep + 1}`} · còn{" "}
                {formatTime(Math.max(0, resume.duration - resume.position))}
              </p>
              <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
              </span>
            </Link>
            <Link
              to="/watch/$slug"
              params={{ slug: resume.slug }}
              search={{ src: resume.source, ep: resume.ep, srv: resume.srv }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Play className="h-3.5 w-3.5" /> Tiếp tục
            </Link>
            <button
              aria-label="Ẩn gợi ý xem tiếp"
              onClick={() => {
                const key = `${resume.source}:${resume.slug}:${resume.ep}`;
                sessionStorage.setItem(DISMISS_KEY, key);
                setDismissed(key);
              }}
              className="absolute right-1 top-1 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
