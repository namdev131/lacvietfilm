import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("src/styles.css");
const root = read("src/routes/__root.tsx");
const home = read("src/routes/index.tsx");
const settings = read("src/lib/settings.tsx");
const card = read("src/components/MovieCard.tsx");

const must = (ok, message) => { if (!ok) throw new Error(message); };

must(settings.includes('theme: "system" | "light" | "dark"'), "Thiếu cài đặt theme sáng/tối/system");
must(settings.includes('root.dataset.theme'), "Theme chưa áp dụng lên document");
must(root.includes("ThemeToggle"), "Thiếu nút đổi sắc trời trong header");
must(root.includes('className="skip-link"'), "Thiếu liên kết bỏ qua điều hướng");
must(home.includes("heritage-hero"), "Trang chủ chưa có bố cục di sản mới");
must(home.includes("heritage-source-bar"), "Thanh nguồn chưa được tái cấu trúc");
must(card.includes("movie-card-frame"), "Thẻ phim chưa theo hệ khung mới");
must(css.includes('[data-theme="light"]'), "Thiếu token giấy dó sáng");
must(css.includes('[data-theme="dark"]'), "Thiếu token đêm sao tối");
must(css.includes("--paper-fiber"), "Thiếu chất liệu giấy dó");
must(css.includes("--star-field"), "Thiếu trường sao Việt cổ");
must(css.includes("prefers-color-scheme: dark"), "Thiếu mặc định theo hệ thống");
must(css.includes("prefers-reduced-motion: reduce"), "Thiếu giảm chuyển động");
console.log("viet heritage theme check: PASS");
