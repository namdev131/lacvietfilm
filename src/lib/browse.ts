import type { MovieCard } from "./types";

/** Ảnh KKPhim */
function kkImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://phimimg.com/${u.replace(/^\//, "")}`;
}
/** Ảnh OPhim */
function opImg(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/uploads")) return `https://img.ophim.live${u}`;
  return `https://img.ophim.live/uploads/movies/${u}`;
}

export interface Taxonomy {
  name: string;
  slug: string;
}

export type BrowseType = "the-loai" | "quoc-gia" | "nam";

export const SORT_FIELDS = [
  { id: "modified.time", label: "Mới cập nhật" },
  { id: "_id", label: "Mới thêm" },
  { id: "year", label: "Năm sản xuất" },
] as const;

export type SortField = (typeof SORT_FIELDS)[number]["id"];

export function yearOptions(): Taxonomy[] {
  const now = new Date().getFullYear();
  const out: Taxonomy[] = [];
  for (let y = now; y >= now - 25; y--) out.push({ name: String(y), slug: String(y) });
  return out;
}

export async function fetchGenres(): Promise<Taxonomy[]> {
  const r = await fetch("https://phimapi.com/the-loai");
  const j = await r.json();
  const items = j?.data?.items ?? j?.items ?? [];
  return items.map((c: any) => ({ name: c.name, slug: c.slug }));
}

export async function fetchCountries(): Promise<Taxonomy[]> {
  const r = await fetch("https://phimapi.com/quoc-gia");
  const j = await r.json();
  const items = j?.data?.items ?? j?.items ?? [];
  return items.map((c: any) => ({ name: c.name, slug: c.slug }));
}

export interface BrowseResult {
  items: MovieCard[];
  totalPages: number;
  title?: string;
}

/** Duyệt phim theo thể loại / quốc gia / năm (nguồn KKPhim, có bộ lọc + sắp xếp) */
export async function fetchBrowse(opts: {
  type: BrowseType;
  value: string;
  page?: number;
  year?: string;
  sort?: SortField;
  sortType?: "asc" | "desc";
}): Promise<BrowseResult> {
  const { type, value, page = 1, year, sort = "modified.time", sortType = "desc" } = opts;
  const params = new URLSearchParams({
    page: String(page),
    limit: "24",
    sort_field: sort,
    sort_type: sortType,
  });
  if (year && type !== "nam") params.set("year", year);
  const path = type === "nam" ? `nam/${value}` : `${type}/${value}`;
  const r = await fetch(`https://phimapi.com/v1/api/${path}?${params.toString()}`);
  const j = await r.json();
  const data = j?.data ?? {};
  const items: MovieCard[] = (data.items || []).map((m: any) => ({
    slug: m.slug,
    name: m.name,
    origin_name: m.origin_name,
    poster: kkImg(m.poster_url),
    thumb: kkImg(m.thumb_url),
    year: m.year,
    quality: m.quality,
    lang: m.lang,
    episode_current: m.episode_current,
    source: "kkphim" as const,
  }));
  const pg = data?.params?.pagination;
  const totalPages = pg?.totalItems && pg?.totalItemsPerPage
    ? Math.max(1, Math.ceil(pg.totalItems / pg.totalItemsPerPage))
    : items.length === 24
      ? page + 1
      : page;
  return { items, totalPages, title: data?.titlePage };
}

/** Phim sắp chiếu (nguồn OPhim) */
export async function fetchUpcoming(page = 1): Promise<MovieCard[]> {
  const r = await fetch(`https://ophim1.com/v1/api/danh-sach/phim-sap-chieu?page=${page}`);
  const j = await r.json();
  const items = j?.data?.items || [];
  return items.map(
    (m: any): MovieCard => ({
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      poster: opImg(m.poster_url || m.thumb_url),
      thumb: opImg(m.thumb_url || m.poster_url),
      year: m.year,
      quality: m.quality,
      lang: m.lang,
      episode_current: m.episode_current,
      source: "ophim",
    }),
  );
}
