import type { EpisodeServer, MovieCard, MovieDetail, SourceId } from "../types";

export const PUBLIC_API_SOURCES = {
  rapchieuphim: {
    base: "https://rapchieuphim.com/api/v1",
    metadataOnly: true,
  },
  aiphim: {
    base: "https://aiphim.online/api",
    metadataOnly: false,
  },
  thuongkhung3d: {
    base: "https://animation.thuongkhung3d.my/api/v1",
    metadataOnly: false,
  },
  animapper: {
    base: "https://api.animapper.net/api/v1",
    metadataOnly: true,
  },
} as const;

type PublicSource = keyof typeof PUBLIC_API_SOURCES;

async function json(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Movie API ${response.status}: ${url}`);
  return response.json();
}

function absolute(base: string, value?: string) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  return new URL(value, base).href;
}

function epServers(episodes: any[] = []): EpisodeServer[] {
  return episodes.map((server) => ({
    server_name: server.server_name || server.name || "Vietsub",
    items: (server.server_data || server.episodes || []).map((ep: any) => {
      const url = ep.link_m3u8 || ep.link_embed || ep.url || "";
      return {
        name: String(ep.name || ep.num || ep.episodeNumber || ""),
        slug: String(ep.slug || ep.episodeId || ep.num || ep.name || ""),
        m3u8: url.includes(".m3u8") ? url : undefined,
        embed: url && !url.includes(".m3u8") ? url : undefined,
      };
    }),
  }));
}

function aiCard(item: any, source: SourceId): MovieCard {
  const m = item.info || item;
  return {
    slug: String(m.slug || m.id),
    name: m.title || m.name || m.original_title || String(m.id),
    origin_name: m.original_title || m.origin_name,
    poster: m.poster || m.poster_url || "",
    thumb: m.thumb || m.thumb_url || m.poster || "",
    year: m.year,
    quality: m.quality,
    lang: m.language || m.lang,
    episode_current: m.episode_current,
    source: source,
  };
}

function aniCard(m: any, source: SourceId): MovieCard {
  const titles = m.titles || {};
  const images = m.images || {};
  return {
    slug: String(m.id),
    name: titles.vi || titles.en || titles["user-preferred"] || titles.main || String(m.id),
    origin_name: titles.main || titles["ja-ro"],
    poster: images.coverXl || images.coverLg || images.coverMd || "",
    thumb: images.bannerUrl || images.coverLg || images.coverXl || "",
    year: m.seasonYear || m.startDate?.slice?.(0, 4),
    quality: m.format,
    episode_current: m.totalUnits ? `${m.totalUnits} tập` : undefined,
    source: source,
  };
}

let rapCache: any[] | null = null;
async function rapMovies() {
  return (rapCache ??= await json(`${PUBLIC_API_SOURCES.rapchieuphim.base}/movies`));
}

export async function publicApiLatest(source: PublicSource, page = 1): Promise<MovieCard[]> {
  if (source === "rapchieuphim") {
    const movies = await rapMovies();
    const start = Math.max(0, movies.length - page * 24);
    return movies.slice(start, start + 24).reverse().map((m) => ({
      ...aiCard(m, source),
      poster: absolute("https://rapchieuphim.com", m.poster),
      thumb: absolute("https://rapchieuphim.com", m.poster),
    }));
  }
  if (source === "aiphim") {
    const body = await json(`${PUBLIC_API_SOURCES.aiphim.base}/latest?page=${page}`);
    return (body.data || []).map((m: any) => aiCard(m, source));
  }
  if (source === "thuongkhung3d") {
    const body = await json(
      `${PUBLIC_API_SOURCES.thuongkhung3d.base}/movies?page=${page}&limit=24&sort=modified`,
    );
    return (body.data || []).map((m: any) => aiCard(m, source));
  }
  const body = await json(
    `${PUBLIC_API_SOURCES.animapper.base}/search?mediaType=ANIME&limit=24&offset=${(page - 1) * 24}`,
  );
  return (body.results || []).map((m: any) => aniCard(m, source));
}

export async function publicApiSearch(q: string, source: PublicSource): Promise<MovieCard[]> {
  const keyword = encodeURIComponent(q.trim());
  if (source === "rapchieuphim") {
    const normalized = q.toLocaleLowerCase("vi-VN");
    return (await rapMovies())
      .filter((m) => `${m.name} ${m.en_name || ""}`.toLocaleLowerCase("vi-VN").includes(normalized))
      .slice(0, 48)
      .map((m) => ({
        ...aiCard(m, source),
        poster: absolute("https://rapchieuphim.com", m.poster),
        thumb: absolute("https://rapchieuphim.com", m.poster),
      }));
  }
  if (source === "aiphim") {
    const body = await json(`${PUBLIC_API_SOURCES.aiphim.base}/search?q=${keyword}`);
    return (body.data?.movies || body.data || []).map((m: any) => aiCard(m, source));
  }
  if (source === "thuongkhung3d") {
    const body = await json(`${PUBLIC_API_SOURCES.thuongkhung3d.base}/movies/search?q=${keyword}`);
    return (body.data || []).map((m: any) => aiCard(m, source));
  }
  const body = await json(
    `${PUBLIC_API_SOURCES.animapper.base}/search?title=${keyword}&mediaType=ANIME&limit=24`,
  );
  return (body.results || []).map((m: any) => aniCard(m, source));
}

export async function publicApiDetail(slug: string, source: PublicSource): Promise<MovieDetail> {
  const safeSlug = encodeURIComponent(slug);
  if (source === "rapchieuphim") {
    const m = await json(`${PUBLIC_API_SOURCES.rapchieuphim.base}/movies/${safeSlug}`);
    return {
      ...aiCard(m, source),
      poster: absolute("https://rapchieuphim.com", m.poster),
      thumb: absolute("https://rapchieuphim.com", m.poster),
      content: m.description,
      time: m.duration,
      country: m.country ? [m.country] : [],
      servers: [],
      source: source,
    };
  }
  if (source === "aiphim") {
    const body = await json(`${PUBLIC_API_SOURCES.aiphim.base}/movie/${safeSlug}`);
    const m = body.data || {};
    const info = m.info || m;
    return {
      ...aiCard(m, source),
      content: info.description,
      time: info.duration,
      category: info.genres || [],
      country: info.country ? [info.country] : [],
      actors: info.actors || [],
      director: info.director || [],
      servers: epServers(m.servers),
      source: source,
    };
  }
  if (source === "thuongkhung3d") {
    const body = await json(`${PUBLIC_API_SOURCES.thuongkhung3d.base}/movies/${safeSlug}`);
    const m = body.data || {};
    return {
      ...aiCard(m, source),
      content: m.content,
      time: m.time,
      category: (m.category || []).map((x: any) => x.name),
      country: (m.country || []).map((x: any) => x.name),
      actors: m.actor || [],
      director: m.director || [],
      servers: epServers(m.episodes),
      source: source,
    };
  }
  const body = await json(`${PUBLIC_API_SOURCES.animapper.base}/metadata?id=${safeSlug}`);
  const m = body.result || {};
  const card = aniCard(m, source);
  return {
    ...card,
    content: m.descriptions?.vi || m.descriptions?.en,
    time: m.unitDurationMin ? `${m.unitDurationMin} phút` : undefined,
    category: (m.genres || []).map((x: any) => x.name),
    country: m.countryOfOrigin ? [m.countryOfOrigin] : [],
    servers: [],
    source: source,
  };
}
