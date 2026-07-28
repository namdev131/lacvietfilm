import type {
  MovieCard,
  MovieDetail,
  EpisodeServer,
  SourceId,
  SourceFilter,
} from "./types";

export const SOURCES: { id: SourceId; label: string; base: string }[] = [
  { id: "kkphim", label: "KKPhim", base: "https://phimapi.com" },
  { id: "ophim", label: "OPhim", base: "https://ophim1.com" },
  { id: "nguonc", label: "NguonC", base: "https://phim.nguonc.com/api" },
  { id: "vsmov", label: "VSMov", base: "https://vsmov.com/api" },
];

// ---------- Ping ----------
export async function pingSource(id: SourceId): Promise<number> {
  const src = SOURCES.find((s) => s.id === id)!;
  const url =
    id === "kkphim"
      ? `${src.base}/danh-sach/phim-moi-cap-nhat-v3?page=1`
      : id === "ophim"
        ? `${src.base}/danh-sach/phim-moi-cap-nhat?page=1`
        : id === "vsmov"
          ? `${src.base}/danh-sach/phim-moi-cap-nhat?page=1`
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
function vsmovImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://vsmov.com/storage/${u.replace(/^\/+/, "")}`;
}


// ---------- Latest lists ----------
export async function fetchLatest(source: SourceId, page = 1): Promise<MovieCard[]> {
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
  if (source === "vsmov") {
    const r = await fetch(`https://vsmov.com/api/danh-sach/phim-moi-cap-nhat?page=${page}`);
    const j = await r.json();
    return (j.items || []).map(
      (m: any): MovieCard => ({
        slug: m.slug,
        name: m.name,
        origin_name: m.origin_name,
        poster: vsmovImg(m.poster_url),
        thumb: vsmovImg(m.thumb_url),
        year: m.year,
        quality: m.quality,
        lang: m.lang,
        episode_current: m.episode_current,
        source: "vsmov",
      }),
    );
  }
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
