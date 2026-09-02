import type { SourceId } from "@/lib/types";
import { watchHistoryApi } from "@/lib/watchHistoryApi";

export interface ProgressEntry {
  slug: string;
  source: SourceId | string;
  ep: number;
  srv: number;
  position: number;
  duration: number;
  updatedAt: number;
}

const LS_KEY = "lv-progress";

function readAll(): Record<string, ProgressEntry> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, ProgressEntry>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function progressKey(source: string, slug: string, srv: number, ep: number) {
  return `${source}:${slug}:${srv}:${ep}`;
}

export function getLocalProgress(
  source: string,
  slug: string,
  srv: number,
  ep: number,
): ProgressEntry | null {
  if (typeof window === "undefined") return null;
  return readAll()[progressKey(source, slug, srv, ep)] ?? null;
}

/** Tiến độ gần nhất của 1 phim (bất kể tập nào) */
export function getLatestProgressForSlug(slug: string): ProgressEntry | null {
  if (typeof window === "undefined") return null;
  const rows = Object.values(readAll()).filter((r) => r.slug === slug);
  if (!rows.length) return null;
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export function setLocalProgress(entry: Omit<ProgressEntry, "updatedAt">) {
  if (typeof window === "undefined") return;
  const map = readAll();
  map[progressKey(entry.source, entry.slug, entry.srv, entry.ep)] = {
    ...entry,
    updatedAt: Date.now(),
  };
  // giữ tối đa 300 mục gần nhất
  const keys = Object.keys(map);
  if (keys.length > 300) {
    keys
      .sort((a, b) => map[a].updatedAt - map[b].updatedAt)
      .slice(0, keys.length - 300)
      .forEach((k) => delete map[k]);
  }
  writeAll(map);
}

/** % xem xong (0-100) */
export function progressPercent(position: number, duration: number) {
  if (!duration || duration < 1) return 0;
  return Math.min(100, Math.round((position / duration) * 100));
}

export function isFinished(position: number, duration: number) {
  return duration > 60 && position >= duration - 60;
}

export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Đồng bộ tiến độ lên Cloud (chỉ khi đã đăng nhập) */
export async function syncProgress(
  userId: string,
  entry: {
    slug: string;
    name: string;
    poster?: string | null;
    source: string;
    ep: number;
    srv: number;
    episode_slug?: string | null;
    episode_name?: string | null;
    episode_count?: number;
    position: number;
    duration: number;
  },
) {
  try {
    void userId;
    await watchHistoryApi("progress", entry);
    window.dispatchEvent(new CustomEvent("lv-history-sync"));
  } catch (error) {
    console.error("syncProgress failed", error);
  }
}

/** Mục đang xem dở gần nhất (local, dùng khi chưa đăng nhập) */
export function getLatestUnfinishedProgress(): ProgressEntry | null {
  if (typeof window === "undefined") return null;
  const rows = Object.values(readAll())
    .filter((r) => r.position > 30 && !isFinished(r.position, r.duration))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return rows[0] ?? null;
}

/** Đổi slug thành tên hiển thị tạm khi không có tên phim */
export function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
