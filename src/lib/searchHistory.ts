const KEY = "lvc:search-history:v2";
const LEGACY_KEY = "lvc:search-history";
const MAX = 12;

export interface SearchHistoryItem {
  /** từ khoá */
  q: string;
  /** số lần tìm */
  count: number;
  /** lần cuối tìm (epoch ms) */
  at: number;
  /** số kết quả lần cuối */
  hits?: number;
}

const isBrowser = () => typeof window !== "undefined";

function read(): SearchHistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((x) => x && typeof x.q === "string" && x.q.trim())
          .map((x) => ({
            q: String(x.q),
            count: Number(x.count) || 1,
            at: Number(x.at) || 0,
            hits: typeof x.hits === "number" ? x.hits : undefined,
          }))
          .slice(0, MAX);
      }
    }
    // migrate từ định dạng cũ (mảng string)
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr)) {
        const migrated: SearchHistoryItem[] = arr
          .filter((x) => typeof x === "string" && x.trim())
          .slice(0, MAX)
          .map((q: string, i: number) => ({ q, count: 1, at: Date.now() - i }));
        write(migrated);
        window.localStorage.removeItem(LEGACY_KEY);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function write(items: SearchHistoryItem[]): SearchHistoryItem[] {
  const next = items.slice(0, MAX);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function getSearchHistory(): SearchHistoryItem[] {
  return read();
}

/** Lưu/nâng hạng một từ khoá. `hits` = số kết quả trả về (nếu biết). */
export function pushSearchHistory(term: string, hits?: number): SearchHistoryItem[] {
  const q = (term || "").replace(/\s+/g, " ").trim();
  if (!isBrowser() || q.length < 2) return read();
  const cur = read();
  const found = cur.find((x) => x.q.toLowerCase() === q.toLowerCase());
  const item: SearchHistoryItem = {
    q,
    count: (found?.count || 0) + 1,
    at: Date.now(),
    hits: hits ?? found?.hits,
  };
  const rest = cur.filter((x) => x.q.toLowerCase() !== q.toLowerCase());
  return write([item, ...rest]);
}

export function removeSearchHistory(term: string): SearchHistoryItem[] {
  return write(read().filter((x) => x.q !== term));
}

export function clearSearchHistory(): SearchHistoryItem[] {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }
  return [];
}

/** Gợi ý từ lịch sử theo tiền tố đang gõ, ưu tiên tần suất rồi thời gian. */
export function matchHistory(prefix: string, limit = 5): SearchHistoryItem[] {
  const p = (prefix || "").toLowerCase().trim();
  return read()
    .filter((x) => (p ? x.q.toLowerCase().includes(p) : true))
    .sort((a, b) => b.count - a.count || b.at - a.at)
    .slice(0, limit);
}
