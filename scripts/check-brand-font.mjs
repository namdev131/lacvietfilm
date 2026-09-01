import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
const brand = readFileSync(new URL("../src/components/BrandName.tsx", import.meta.url), "utf8");

assert(css.includes("font-family: var(--font-display)"), "Tên Lạc Việt Film chưa dùng lại font cũ");
assert(css.includes("linear-gradient(105deg, #ff3d91"), "Chữ thương hiệu thiếu gradient hồng vàng");
assert(css.includes("background-clip: text"), "Gradient thương hiệu chưa clip vào chữ");
assert(!css.includes('font-family: "SVN Hottroof Semhesta"'), "Font SVN vẫn còn được áp dụng");
assert(!css.includes('src: url("/fonts/SVN-Hottroof-Semhesta.otf")'), "Font SVN vẫn còn được nhúng");
assert(brand.includes("lacviet-brand"), "Tên thương hiệu thiếu hook riêng");
assert(css.includes("font-size: 1.35em"), "Tên thương hiệu chưa được phóng to");
assert(root.includes("<BrandName"), "Header/footer chưa dùng component thương hiệu");
assert(!css.includes('--font-display: "SVN Hottroof Semhesta"'), "Font SVN đang áp dụng sai cho toàn trang");

console.log("brand font contract: PASS");
