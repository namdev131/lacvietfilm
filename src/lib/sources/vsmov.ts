import type { MovieCard, MovieDetail, EpisodeServer } from "@/lib/types";

/** ------- VSMov (https://vsmov.com/api-document) ------- */
export const VSMOV_BASE = "https://vsmov.com/api";
export const VSMOV_LATEST = `${VSMOV_BASE}/danh-sach/phim-moi-cap-nhat`;

export function vsmovImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://vsmov.com/storage/${u.replace(/^\/+/, "")}`;
}

/**
 * Trình nhúng của VSMov (JW Player) bị khoá theo tên miền nên không phát được
 * khi đặt trong iframe của site khác. Ta lấy thẳng luồng HLS:
 *   https://<host>/video/<id>  ->  https://<host>/stream/<id>/master.m3u8
 * và cho chạy qua proxy nội bộ để có CORS hợp lệ.
 */
export function vsmovM3u8(embed?: string): string | undefined {
  if (!embed) return undefined;
  const m = embed.match(/^(https?:\/\/[^/]+)\/video\/([^/?#]+)/i);
  if (!m) return undefined;
  return `${m[1]}/stream/${m[2]}/master.m3u8`;
}

export function vsmovProxy(url?: string): string | undefined {
  if (!url) return undefined;
  return `/api/public/vsmov-stream?u=${encodeURIComponent(url)}`;
}

function toCard(m: any): MovieCard {
  return {
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
  };
}

export async function vsmovLatest(page = 1): Promise<MovieCard[]> {
  const r = await fetch(`${VSMOV_LATEST}?page=${page}`);
  if (!r.ok) return [];
  const j = await r.json();
  const items = j?.items || j?.data?.items || [];
  return items.map(toCard);
}

export async function vsmovSearch(q: string, limit = 24): Promise<MovieCard[]> {
  const r = await fetch(
    `${VSMOV_BASE}/tim-kiem?keyword=${encodeURIComponent(q)}&limit=${limit}`,
  );
  if (!r.ok) return [];
  const j = await r.json();
  const items = j?.items || j?.data?.items || [];
  return items.map(toCard);
}

export async function vsmovDetail(slug: string): Promise<MovieDetail> {
  const r = await fetch(`${VSMOV_BASE}/phim/${slug}`);
  const j = await r.json();
  const m = j?.movie ?? j?.data?.item ?? {};
  const rawServers = j?.episodes ?? m?.episodes ?? [];

  const servers: EpisodeServer[] = (rawServers || []).map((s: any) => ({
    server_name: String(s.server_name || "Vietsub").replace(/\s+/g, " ").trim(),
    items: (s.server_data || s.items || []).map((ep: any) => {
      const raw = String(ep.name || ep.filename || "");
      const embed = ep.link_embed || ep.embed || undefined;
      const direct = ep.link_m3u8 || ep.m3u8 || vsmovM3u8(embed);
      return {
        name: /^\d+$/.test(raw) ? `Tập ${raw}` : raw,
        slug: ep.slug || raw,
        m3u8: vsmovProxy(direct),
        embed,
      };
    }),
  }));

  return {
    slug: m.slug || slug,
    name: m.name,
    origin_name: m.origin_name,
    poster: vsmovImg(m.poster_url),
    thumb: vsmovImg(m.thumb_url),
    content: m.content,
    year: m.year,
    quality: m.quality,
    lang: m.lang,
    episode_current: m.episode_current,
    time: m.time,
    category: (m.category || []).map((c: any) => c.name ?? c),
    country: (m.country || []).map((c: any) => c.name ?? c),
    actors: m.actor || [],
    director: m.director || [],
    servers,
    source: "vsmov",
  };
}
