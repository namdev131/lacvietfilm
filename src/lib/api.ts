import type {
  MovieCard,
  MovieDetail,
  EpisodeServer,
  SourceId,
  SourceFilter,
} from "./types";
import {
  VSMOV_BASE,
  VSMOV_LATEST,
  vsmovLatest,
  vsmovSearch,
  vsmovDetail,
} from "./sources/vsmov";
import {
  PUBLIC_API_SOURCES,
  publicApiDetail,
  publicApiLatest,
  publicApiSearch,
} from "./sources/public-movie-apis";

export const SOURCES: { id: SourceId; label: string; base: string }[] = [
  { id: "kkphim", label: "KKPhim", base: "https://phimapi.com" },
  { id: "ophim", label: "OPhim", base: "https://ophim1.com" },
  { id: "nguonc", label: "NguonC", base: "https://phim.nguonc.com/api" },
  { id: "vsmov", label: "VSMov", base: VSMOV_BASE },

  { id: "aiphim", label: "AI Phim", base: PUBLIC_API_SOURCES.aiphim.base },
  { id: "thuongkhung3d", label: "Thượng Khung 3D", base: PUBLIC_API_SOURCES.thuongkhung3d.base },
  { id: "animapper", label: "AniMapper", base: PUBLIC_API_SOURCES.animapper.base },
];

/** Nguồn phim dùng cho tìm kiếm; Rạp Chiếu Phim có trang riêng. */
export const SEARCH_SOURCES: SourceId[] = SOURCES.map((source) => source.id).filter(
  (id) => id !== "rapchieuphim",
);

// ---------- Ping ----------
export async function pingSource(id: SourceId): Promise<number> {
  const src = SOURCES.find((s) => s.id === id)!;
  if (id === "aiphim" || id === "thuongkhung3d" || id === "animapper") {
    const start = performance.now();
    try {
      await publicApiLatest(id, 1);
      return Math.round(performance.now() - start);
    } catch {
      return -1;
    }
  }
  const url =
    id === "kkphim"
      ? `${src.base}/danh-sach/phim-moi-cap-nhat-v3?page=1`
      : id === "ophim"
        ? `${src.base}/danh-sach/phim-moi-cap-nhat?page=1`
        : id === "vsmov"
          ? `${VSMOV_LATEST}?page=1`
          : `${src.base}/films/phim-moi-cap-nhat?page=1`;
  const start = performance.now();
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return -1;
    await r.text();
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}


// ---------- Normalize helpers ----------
function kkImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://phimimg.com/${u}`;
}
function ophimImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://img.ophim.live/uploads/movies/${u}`;
}


// ---------- Latest lists ----------
export async function fetchLatest(source: SourceId, page = 1): Promise<MovieCard[]> {
  if (source === "aiphim" || source === "thuongkhung3d" || source === "animapper") {
    return publicApiLatest(source, page);
  }
  if (source === "kkphim") {
    const r = await fetch(
      `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${page}`,
    );
    const j = await r.json();
    return (j.items || []).map(
      (m: any): MovieCard => ({
        slug: m.slug,
        name: m.name,
        origin_name: m.origin_name,
        poster: kkImg(m.poster_url),
        thumb: kkImg(m.thumb_url),
        year: m.year,
        quality: m.quality,
        lang: m.lang,
        episode_current: m.episode_current,
        source: "kkphim",
      }),
    );
  }
  if (source === "ophim") {
    const r = await fetch(`https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`);
    const j = await r.json();
    return (j.items || []).map(
      (m: any): MovieCard => ({
        slug: m.slug,
        name: m.name,
        origin_name: m.origin_name,
        poster: ophimImg(m.poster_url),
        thumb: ophimImg(m.thumb_url),
        year: m.year,
        source: "ophim",
      }),
    );
  }
  if (source === "vsmov") return vsmovLatest(page);
  const r = await fetch(

    `https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=${page}`,
  );
  const j = await r.json();
  return (j.items || []).map(
    (m: any): MovieCard => ({
      slug: m.slug,
      name: m.name,
      origin_name: m.original_name,
      poster: m.poster_url || m.thumb_url,
      thumb: m.thumb_url || m.poster_url,
      source: "nguonc",
    }),
  );
}

export async function searchMovies(q: string, source: SourceId): Promise<MovieCard[]> {
  if (!q.trim()) return [];
  if (source === "aiphim" || source === "thuongkhung3d" || source === "animapper") {
    return publicApiSearch(q, source);
  }
  if (source === "kkphim") {
    const r = await fetch(
      `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(q)}&limit=24`,
    );
    const j = await r.json();
    const items = j?.data?.items || [];
    return items.map(
      (m: any): MovieCard => ({
        slug: m.slug,
        name: m.name,
        origin_name: m.origin_name,
        poster: kkImg(m.poster_url),
        thumb: kkImg(m.thumb_url),
        year: m.year,
        quality: m.quality,
        lang: m.lang,
        episode_current: m.episode_current,
        source: "kkphim",
      }),
    );
  }
  if (source === "ophim") {
    const r = await fetch(
      `https://ophim1.com/v1/api/tim-kiem?keyword=${encodeURIComponent(q)}&limit=24`,
    );
    const j = await r.json();
    const items = j?.data?.items || [];
    return items.map(
      (m: any): MovieCard => ({
        slug: m.slug,
        name: m.name,
        poster: ophimImg(m.poster_url),
        thumb: ophimImg(m.thumb_url),
        year: m.year,
        source: "ophim",
      }),
    );
  }
  if (source === "vsmov") return vsmovSearch(q);
  const r = await fetch(

    `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(q)}`,
  );
  const j = await r.json();
  return (j.items || []).map(
    (m: any): MovieCard => ({
      slug: m.slug,
      name: m.name,
      origin_name: m.original_name,
      poster: m.poster_url || m.thumb_url,
      thumb: m.thumb_url || m.poster_url,
      source: "nguonc",
    }),
  );
}

// ---------- Detail ----------
function normalizeKKOphimServers(episodes: any[]): EpisodeServer[] {
  return (episodes || []).map((s: any) => ({
    server_name: s.server_name || "Vietsub",
    items: (s.server_data || []).map((ep: any) => ({
      name: ep.name || ep.filename || "",
      slug: ep.slug || ep.name || "",
      m3u8: ep.link_m3u8 || undefined,
      embed: ep.link_embed || undefined,
    })),
  }));
}

export async function fetchDetail(slug: string, source: SourceId): Promise<MovieDetail> {
  if (source === "aiphim" || source === "thuongkhung3d" || source === "animapper") {
    return publicApiDetail(slug, source);
  }
  if (source === "kkphim") {
    const r = await fetch(`https://phimapi.com/phim/${slug}`);
    const j = await r.json();
    const m = j.movie;
    return {
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      poster: kkImg(m.poster_url),
      thumb: kkImg(m.thumb_url),
      content: m.content,
      year: m.year,
      quality: m.quality,
      lang: m.lang,
      episode_current: m.episode_current,
      time: m.time,
      category: (m.category || []).map((c: any) => c.name),
      country: (m.country || []).map((c: any) => c.name),
      actors: m.actor || [],
      director: m.director || [],
      servers: normalizeKKOphimServers(j.episodes),
      source: "kkphim",
    };
  }
  if (source === "ophim") {
    const r = await fetch(`https://ophim1.com/phim/${slug}`);
    const j = await r.json();
    const m = j.movie;
    return {
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      poster: ophimImg(m.poster_url),
      thumb: ophimImg(m.thumb_url),
      content: m.content,
      year: m.year,
      quality: m.quality,
      lang: m.lang,
      episode_current: m.episode_current,
      time: m.time,
      category: (m.category || []).map((c: any) => c.name),
      country: (m.country || []).map((c: any) => c.name),
      actors: m.actor || [],
      director: m.director || [],
      servers: normalizeKKOphimServers(j.episodes),
      source: "ophim",
    };
  }
  if (source === "vsmov") return vsmovDetail(slug);
  const r = await fetch(`https://phim.nguonc.com/api/film/${slug}`);

  const j = await r.json();
  const m = j.movie;
  const servers: EpisodeServer[] = (m.episodes || []).map((s: any) => ({
    server_name: s.server_name || "Vietsub",
    items: (s.items || []).map((ep: any) => ({
      name: ep.name?.startsWith("Tập") ? ep.name : `Tập ${ep.name}`,
      slug: ep.slug || ep.name || "",
      m3u8: ep.m3u8 || undefined,
      embed: ep.embed || undefined,
    })),
  }));
  const catList: string[] = [];
  if (m.category) {
    for (const k of Object.keys(m.category)) {
      const grp = m.category[k];
      if (grp?.list) for (const c of grp.list) catList.push(c.name);
    }
  }
  return {
    slug: m.slug,
    name: m.name,
    origin_name: m.original_name,
    poster: m.poster_url || m.thumb_url,
    thumb: m.thumb_url || m.poster_url,
    content: m.description,
    year: undefined,
    quality: m.quality,
    lang: m.language,
    episode_current: m.current_episode,
    time: m.time,
    category: catList,
    country: [],
    actors: (m.casts || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    director: (m.director || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    servers,
    source: "nguonc",
  };
}

// ---------- Gộp nhiều nguồn ----------
const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** Trộn kết quả từ nhiều nguồn theo kiểu xen kẽ + khử trùng lặp theo tên/năm */
export function mergeMovies(lists: MovieCard[][]): MovieCard[] {
  const out: MovieCard[] = [];
  const seen = new Set<string>();
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      const m = list[i];
      if (!m) continue;
      const key = `${norm(m.origin_name || m.name)}-${m.year ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

const ALL_SOURCES: SourceId[] = SOURCES.map((s) => s.id);

async function settled(tasks: Promise<MovieCard[]>[]): Promise<MovieCard[][]> {
  const res = await Promise.allSettled(tasks);
  return res.map((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function fetchLatestMerged(
  source: SourceFilter,
  page = 1,
): Promise<MovieCard[]> {
  if (source !== "all") return fetchLatest(source, page);
  return mergeMovies(await settled(ALL_SOURCES.map((s) => fetchLatest(s, page))));
}

const tokens = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/**
 * Điểm liên quan 0–100:
 * khớp tuyệt đối > khớp đầu chuỗi > chứa nguyên cụm > phủ token (ưu tiên token đứng đầu)
 * + thưởng nhẹ cho phim có năm/chất lượng, phạt tên quá dài so với từ khoá.
 */
function relevance(m: MovieCard, q: string): number {
  const nq = norm(q);
  if (!nq) return 0;
  const qt = tokens(q);
  const fields: { v: string; w: number }[] = [
    { v: m.name || "", w: 1 },
    { v: m.origin_name || "", w: 0.92 },
  ].filter((f) => f.v);

  let best = 0;
  for (const f of fields) {
    const nf = norm(f.v);
    const ft = tokens(f.v);
    let s = 0;
    if (nf === nq) s = 100;
    else if (nf.startsWith(nq)) s = 88;
    else if (nf.includes(nq)) s = 74;
    else if (qt.length) {
      const hit = qt.filter((t) => ft.some((x) => x === t || x.startsWith(t))).length;
      const coverage = hit / qt.length;
      const ordered = qt.every((t, i) => ft[i] && (ft[i] === t || ft[i].startsWith(t)));
      s = Math.round(coverage * 58) + (ordered && coverage === 1 ? 8 : 0);
    }
    // phạt khi tên dài hơn nhiều so với từ khoá (giảm nhiễu)
    if (s > 0 && nf.length > nq.length * 3) s -= 4;
    best = Math.max(best, Math.round(s * f.w));
  }

  if (best > 0) {
    if (m.year) best += 2;
    if (m.quality) best += 1;
    if (m.poster) best += 1;
  }
  return Math.max(0, Math.min(100, best));
}

export async function searchMoviesMerged(
  q: string,
  source: SourceFilter,
): Promise<MovieCard[]> {
  const keyword = q.replace(/\s+/g, " ").trim();
  if (!keyword) return [];
  const merged =
    source !== "all"
      ? await searchMovies(keyword, source).catch(() => [])
      : mergeMovies(await settled(SEARCH_SOURCES.map((s) => searchMovies(keyword, s))));
  return merged
    .map((m, i) => ({ m, i, score: relevance(m, keyword) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.m);
}

