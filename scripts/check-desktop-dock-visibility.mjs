import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

assert(dock.includes('type DesktopDockMode = "shown" | "auto" | "hidden"'), "Dock thiếu ba chế độ desktop");
assert(dock.includes('className="desktop-dock-controls"'), "Dock thiếu nút Auto/Ẩn");
assert(dock.includes('className="desktop-dock-reveal"'), "Dock thiếu nút hiện lại");
assert(css.includes("grid-template-rows: repeat(7, minmax(3.6rem, 4.5rem))"), "Bảy mục đang giãn kín chiều cao");
assert(css.includes("height: auto"), "Dock desktop vẫn chiếm toàn bộ chiều cao");
assert(css.includes(".desktop-dock-controls { display: grid;"), "Nút Auto/Ẩn chưa hiện trong viewport");
assert(css.includes('.dock-shell[data-desktop-mode="auto"][data-desktop-open="false"]'), "Auto-hide thiếu trạng thái thu gọn");
assert(css.includes('.dock-shell[data-desktop-mode="hidden"] .desktop-dock-reveal'), "Hide thủ công thiếu nút khôi phục");
assert(css.includes("background: transparent"), "Trang chủ còn mảng highlight lớn");

console.log("desktop dock visibility check passed");
