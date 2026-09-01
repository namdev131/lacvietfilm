import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");

for (const route of ['to="/"', 'to="/watch/$slug"', 'to="/movie/$slug"', 'to="/browse"']) {
  assert(root.includes(route) || home.includes(route) || dock.includes(route), `Thiếu route giữ nguyên: ${route}`);
}
assert(dock.includes("grid-cols-7"), "Dock không còn đủ 7 mục");
assert(dock.includes("data-desktop-mode"), "Dock mất chế độ desktop");
assert(root.includes("<ThemeToggle />"), "Mất đổi giao diện");
assert(root.includes("<JoinPartyDialog />"), "Mất Watch Party");
assert(root.includes("<NotificationBell />"), "Mất thông báo");
assert(root.includes("<QuickSearch />"), "Mất tìm kiếm nhanh");
for (const token of ["--cinema-ink", "--cinema-surface", "--cinema-line", "--cinema-accent"]) {
  assert(css.includes(token), `Thiếu token redesign ${token}`);
}
for (const selector of [".site-header", ".cinema-hero", ".movie-card-frame", ".trending-card", ".dock-bar", ".site-footer"]) {
  assert(css.includes(selector), `Thiếu bề mặt dùng chung ${selector}`);
}
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Thiếu reduced motion");
assert(css.includes('@media (max-width: 767px)'), "Thiếu mobile layout");
assert(css.includes('@media (min-width: 768px) and (max-width: 1199px)'), "Thiếu tablet layout");
assert(css.includes('@media (max-width: 420px)'), "Thiếu layout mobile hẹp");
assert(css.includes("overflow-x: clip"), "Trang có nguy cơ tràn ngang");
assert(css.includes("env(safe-area-inset-bottom)"), "Dock mobile thiếu safe area");
assert(css.includes('[data-theme="light"]'), "Thiếu light theme");
assert(css.includes('[data-theme="dark"]'), "Thiếu dark theme");

console.log("cinematic redesign contract: PASS");
