import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const browse = readFileSync(new URL("../src/lib/browse.ts", import.meta.url), "utf8");

for (const title of ["Phim Hoạt hình 3D Trung Quốc", "Phim Hàn", "Phim Trung Quốc", "Phim Việt"]) {
  assert(home.includes(`title="${title}"`), `Trang chủ thiếu mục ${title}`);
}
assert(!home.includes('title="Hoạt hình"'), "Trang chủ vẫn còn mục Hoạt hình");
assert(home.includes('queryKey: ["home-shelf", "china-3d-animation"]'), "Thiếu truy vấn Hoạt hình 3D Trung Quốc");
assert(home.includes('queryKey: ["home-shelf", "korea"]'), "Thiếu truy vấn Phim Hàn");
assert(home.includes('queryKey: ["home-shelf", "china"]'), "Thiếu truy vấn Phim Trung Quốc");
assert(home.includes('queryKey: ["home-shelf", "vietnam"]'), "Thiếu truy vấn Phim Việt");
assert(browse.includes("fetchHomeShelf"), "Thiếu hàm tải danh mục trang chủ");
assert(browse.includes('country: "trung-quoc"'), "Hoạt hình 3D Trung Quốc thiếu lọc quốc gia");

console.log("home country/animation shelves contract: PASS");
