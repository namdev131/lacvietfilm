import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

assert(dock.includes('src="https://files.catbox.moe/6ua430.png"'), "Trang chủ chưa dùng logo Catbox");
assert(dock.includes('className="dock-home-logo '), "Logo Trang chủ thiếu hook giao diện");
assert(dock.includes('data-active={active ? "true" : "false"}'), "Trang chủ thiếu trạng thái active rõ ràng");
assert(dock.includes("grid-cols-7"), "Dock không còn 7 mục");
assert(css.includes("--desktop-dock-width: 7.625rem"), "Dock desktop sai chiều rộng 122px");
assert(css.includes("grid-template-columns: 1fr"), "Dock desktop chưa xếp dọc");
assert(css.includes("grid-template-rows: repeat(7, minmax(0, 1fr))"), "Dock desktop chưa đủ 7 hàng");
assert(css.includes("min-height: 6.4rem"), "Trang chủ desktop thiếu orb lớn");
assert(css.includes(".dock-home-icon::before"), "Thiếu đĩa active tròn sau logo");
assert(css.includes("border-radius: 1.875rem"), "Dock desktop thiếu bo góc 30px");
assert(css.includes(".dock-home-logo"), "Thiếu style logo Trang chủ");
assert(css.includes("grid-template-columns: repeat(7, minmax(0, 1fr))"), "Dock mobile chưa giữ 7 cột");
assert(css.includes("--mobile-dock-height: 4.875rem"), "Dock mobile chưa cao 78px");
assert(css.includes("max-width: 47.5rem"), "Dock mobile chưa giới hạn 760px");
assert(css.includes("border-radius: 1.5rem"), "Dock mobile chưa bo 24px");
assert(css.includes("width: 4.5rem; height: 4.5rem"), "Orb Trang chủ mobile chưa đạt 72px");
assert(css.includes("@media (max-width: 430px)"), "Thiếu responsive 430px");
assert(css.includes("@media (max-width: 365px)"), "Thiếu responsive 365px");
assert(css.includes('[data-theme="light"] .dock-bar'), "Dock thiếu màu light mode");
assert(css.includes('[data-theme="dark"] .dock-bar'), "Dock thiếu màu dark mode");
assert(css.includes('[data-theme="light"] .dock-home-icon'), "Orb Trang chủ thiếu light mode");
assert(css.includes('[data-theme="dark"] .dock-home-icon'), "Orb Trang chủ thiếu dark mode");
assert(css.includes('[data-theme="light"] .desktop-dock-controls button'), "Nút navbar desktop thiếu light mode");
assert(css.includes(".dock-shell[data-desktop-mode=\"auto\"][data-desktop-open=\"false\"]"), "Mất auto-hide desktop");
assert(css.includes(".dock-shell[data-desktop-mode=\"hidden\"] .desktop-dock-reveal"), "Mất hide thủ công");
assert(css.includes("@media (max-width: 420px)"), "Thiếu responsive mobile hẹp");

console.log("dockbar reference contract: PASS");
