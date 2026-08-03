export const SITE_URL = "https://lacvietcinema.lovable.app";
export const SITE_NAME = "Lạc Việt Cinema";

/** Chuyển slug thành tên phim dễ đọc để dùng cho tiêu đề/SEO khi chưa có dữ liệu. */
export function titleFromSlug(slug: string): string {
  const words = decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return words.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
