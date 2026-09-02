import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");

for (const rule of ["--mobile-hero-height: 222px", ".cinema-dashboard .cinema-hero h1", ".cinema-dashboard .group.relative.shrink-0", ".home-genres .scroll-row", ".cinema-today-list", "grid-template-columns: repeat(7, minmax(0, 1fr))", "env(safe-area-inset-bottom)"]) {
  assert(css.includes(rule), `Thiếu mobile rule: ${rule}`);
}
assert((dock.match(/label:/g) || []).length >= 7, "DockBar mobile không đủ 7 mục");
for (const source of [dock, root, player]) assert(source.includes("/pwa-icon-192.png"), "Logo local chưa được gắn đầy đủ");
assert(![dock, root, player].some((source) => source.includes("files.catbox.moe/6ua430.png")), "Logo vẫn phụ thuộc Catbox");
assert(!css.includes(".site-header .theme-toggle { display: none; }"), "Nút đổi giao diện đang bị ẩn trên mobile");
for (const rule of [".rank-movement { top: 2.15rem", "min-height: 1.55rem", "flex-direction: row", ".rank-chevrons { width: .7rem; height: .75rem"]) assert(css.includes(rule), `Biến động hạng mobile chưa gọn: ${rule}`);
for (const label of ["Tiếp tục xem", "Danh mục", "Mới cập nhật", "Phim Việt"]) assert(home.includes(label), `Thiếu mục ${label}`);
console.log("mobile reference match contract: PASS");
