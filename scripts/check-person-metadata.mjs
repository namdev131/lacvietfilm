import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/lib/personMetadata.ts", import.meta.url), "utf8");
const actor = readFileSync(new URL("../src/routes/actor.$name.tsx", import.meta.url), "utf8");
const director = readFileSync(new URL("../src/routes/director.$name.tsx", import.meta.url), "utf8");

assert(api.includes("www.wikidata.org/w/api.php"), "Thiếu Wikidata Search API");
assert(api.includes("Special:EntityData"), "Thiếu Wikidata Entity API");
assert(api.includes("commons.wikimedia.org/wiki/Special:Redirect/file"), "Thiếu ảnh Wikimedia Commons");
assert(api.includes("AbortSignal.timeout"), "Thiếu timeout API ngoài");
assert(api.includes("encodeURIComponent"), "Tên người chưa được mã hóa an toàn");
assert(api.includes("P569"), "Thiếu ngày sinh");
assert(api.includes("P18"), "Thiếu ảnh chân dung");
assert(actor.includes('queryKey: ["person-metadata", name, "actor"]'), "Trang diễn viên chưa tải metadata ngoài");
assert(actor.includes("person?.description"), "Trang diễn viên chưa hiện mô tả");
assert(actor.includes("person?.image"), "Trang diễn viên chưa hiện ảnh");
assert(director.includes('queryKey: ["person-metadata", name, "director"]'), "Trang đạo diễn chưa tải metadata ngoài");
assert(director.includes("person?.description"), "Trang đạo diễn chưa hiện mô tả");

console.log("person metadata contract: PASS");
