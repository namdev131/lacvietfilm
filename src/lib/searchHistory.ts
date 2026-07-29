const KEY = "lvc:search-history";
const MAX = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(term: string): string[] {
  const t = (term || "").replace(/\s+/g, " ").trim();
  if (typeof window === "undefined" || t.length < 2) return getSearchHistory();
  const next = [t, ...getSearchHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(
    0,
    MAX,
  );
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function removeSearchHistory(term: string): string[] {
  const next = getSearchHistory().filter((x) => x !== term);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearSearchHistory(): string[] {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}
