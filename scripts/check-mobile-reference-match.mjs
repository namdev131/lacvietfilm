import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");

for (const rule of ["--mobile-hero-height: 222px", ".cinema-dashboard .cinema-hero h1", ".cinema-dashboard .group.relative.shrink-0", ".home-genres .scroll-row", ".cinema-today-list", "grid-template-columns: repeat(7, minmax(0, 1fr))", "env(safe-area-inset-bottom)"]) {
  assert(css.includes(rule), `Thiếu mobile rule: ${rule}`);
}
assert((dock.match(/label:/g) || []).length >= 7, "DockBar mobile không đủ 7 mục");
for (const label of ["Tiếp tục xem", "Danh mục", "Mới cập nhật", "Phim Việt"]) assert(home.includes(label), `Thiếu mục ${label}`);
console.log("mobile reference match contract: PASS");
