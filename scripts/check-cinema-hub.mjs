import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../src/lib/api.ts");
const publicApis = read("../src/lib/sources/public-movie-apis.ts");
const cinemaApi = read("../src/lib/cinema-api.ts");
const route = read("../src/routes/cinema.tsx");
const dock = read("../src/components/DockBar.tsx");

assert(!api.includes('id: "rapchieuphim"'), "Rạp Chiếu Phim còn nằm trong SOURCES chung");
assert(!publicApis.includes("rapchieuphim"), "Rạp Chiếu Phim còn nằm trong adapter API chung");
for (const endpoint of ["/movies", "/cinemas", "/showtimes"]) {
  assert(cinemaApi.includes(endpoint), `cinema-api thiếu endpoint ${endpoint}`);
}
for (const feature of ["fetchCinemaCatalog", "joinCinemaShowtimes", "parseJsonArray", "absoluteCinemaUrl"]) {
  assert(cinemaApi.includes(feature), `cinema-api thiếu ${feature}`);
}
for (const label of ["Phim đang chiếu", "Lịch chiếu", "Hệ thống rạp", "Tìm phim hoặc rạp", "Chọn thành phố", "Chọn ngày"]) {
  assert(route.includes(label), `trang Rạp Chiếu Phim thiếu mục: ${label}`);
}
assert(route.includes('createFileRoute("/cinema")'), "thiếu route /cinema");
assert(dock.includes('to: "/cinema"'), "menu Khám phá thiếu mục Rạp Chiếu Phim");
assert(dock.match(/const items:[\s\S]*?\];/)?.[0].match(/key:/g)?.length === 7, "DockBar phải giữ đúng 7 mục");
console.log("cinema hub contract: PASS");
