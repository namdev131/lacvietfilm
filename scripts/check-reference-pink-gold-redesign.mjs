import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");

for (const token of ["--flix-pink", "--flix-gold", ".cinema-dashboard-grid", ".cinema-today", ".genre-shortcut", ".movie-card-frame", "@media (max-width: 767px)", "@media (max-width: 420px)", "env(safe-area-inset-bottom)", "prefers-reduced-motion"]) {
  assert(css.includes(token), `Thiếu hợp đồng thiết kế: ${token}`);
}
for (const label of ["Top hôm nay", "Tiếp tục xem", "Danh mục", "Mới cập nhật", "Phim Hàn", "Phim Trung Quốc", "Phim Việt"]) {
  assert(home.includes(label), `Thiếu mục hiện có: ${label}`);
}
assert((dock.match(/label:/g) || []).length >= 7, "DockBar không đủ 7 mục");
assert(dock.includes('label: "Trang chủ"'), "Thiếu Trang chủ giữa DockBar");
assert(css.includes("grid-template-columns: repeat(7, minmax(0, 1fr))"), "Mobile DockBar chưa giữ 7 mục");

console.log("reference pink/gold redesign contract: PASS");
