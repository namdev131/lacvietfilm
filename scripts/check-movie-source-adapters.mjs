import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const types = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const adapters = readFileSync(new URL("../src/lib/sources/public-movie-apis.ts", import.meta.url), "utf8");
const movie = readFileSync(new URL("../src/routes/movie.$slug.tsx", import.meta.url), "utf8");
const watch = readFileSync(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8");

for (const id of ["rapchieuphim", "aiphim", "thuongkhung3d", "animapper"]) {
  assert(types.includes(`\"${id}\"`), `SourceId thiếu ${id}`);
  assert(api.includes(`id: \"${id}\"`), `SOURCES thiếu ${id}`);
  assert(movie.includes(`\"${id}\"`), `route phim chưa nhận ${id}`);
  assert(watch.includes(`\"${id}\"`), `route xem chưa nhận ${id}`);
}

for (const base of [
  "https://rapchieuphim.com/api/v1",
  "https://aiphim.online/api",
  "https://animation.thuongkhung3d.my/api/v1",
  "https://api.animapper.net/api/v1",
]) {
  assert(adapters.includes(base), `adapter thiếu base URL ${base}`);
}

for (const name of ["publicApiLatest", "publicApiSearch", "publicApiDetail"]) {
  assert(adapters.includes(`export async function ${name}`), `adapter thiếu ${name}`);
  assert(api.includes(name), `api.ts chưa dùng ${name}`);
}

assert(adapters.includes("response.ok"), "adapter phải từ chối HTTP lỗi");
assert(adapters.includes("encodeURIComponent"), "adapter phải encode slug/từ khóa");
assert(adapters.includes("source: source"), "adapter phải giữ đúng source trong dữ liệu chuẩn hóa");
assert(adapters.includes("metadataOnly"), "nguồn chỉ metadata phải được khai báo rõ");

console.log("public movie source adapters: PASS");
