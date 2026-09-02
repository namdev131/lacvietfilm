import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const search = readFileSync(new URL("../src/routes/search.tsx", import.meta.url), "utf8");

assert(api.includes("export const SEARCH_SOURCES"), "thiếu danh sách nguồn tìm kiếm riêng");
for (const id of ["kkphim", "ophim", "nguonc", "vsmov", "aiphim", "thuongkhung3d", "animapper"]) {
  assert(api.match(new RegExp(`SEARCH_SOURCES[\\s\\S]*?${id}`)), `tìm kiếm thiếu nguồn ${id}`);
}
assert(api.includes('(id) => id !== "rapchieuphim"'), "tìm kiếm phải loại Rạp Chiếu Phim");
assert(search.includes("sources={SEARCH_SOURCES}"), "bộ lọc tìm kiếm chưa dùng nguồn mới");
assert(api.includes("SEARCH_SOURCES.map((s) => searchMovies(keyword, s))"), "tìm tất cả chưa gọi đủ nguồn tìm kiếm");
console.log("search sources contract: PASS");
