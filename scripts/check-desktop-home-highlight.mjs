import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const desktop = css.slice(css.indexOf("@media (min-width: 1024px)"), css.indexOf("@media (max-width: 1023px)"));

assert(desktop.includes(".dock-bar > a:nth-child(4) {"), "Thiếu bề mặt nổi bật Trang chủ desktop");
assert(desktop.includes("background: var(--primary) !important"), "Icon Trang chủ desktop chưa có màu nhấn");
assert(desktop.includes("font-weight: 800"), "Nhãn Trang chủ desktop chưa nổi bật");
console.log("desktop home highlight contract: PASS");
