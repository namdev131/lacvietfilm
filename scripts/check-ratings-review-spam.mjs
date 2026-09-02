import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [api, hook, ui, migration, mcp] = await Promise.all([
  read("src/routes/api/ratings.ts"),
  read("src/hooks/useRatings.ts"),
  read("src/components/RatingStars.tsx"),
  read("supabase/migrations/20260902000000_ratings_review_spam.sql"),
  read("src/lib/mcp/tools/rate-movie.ts"),
]);

assert.match(api, /\/auth\/v1\/user/, "API phải xác thực access token phía server");
assert.match(api, /await ensureSchema\(\)/, "API phải chuẩn bị schema trước khi đọc rating");
assert.doesNotMatch(api, /body\.user_id/, "API không được nhận user_id từ client");
assert.match(api, /Number\.isInteger\(score\).*score < 1.*score > 5/s, "score phải là integer 1-5");
assert.match(api, /review\.trim\(\)/, "review phải trim");
assert.match(api, /review\.length > 1000/, "review tối đa 1000 ký tự");
assert.match(api, /interval '60 seconds'/, "update phải có cooldown 60 giây");
assert.match(api, /status = 'visible'/, "chỉ trả review visible");
assert.match(api, /order by updated_at desc/, "review mới nhất phải đứng trước");
assert.match(api, /on conflict\s*\(user_id,slug\)/, "mỗi user+slug chỉ có một rating");
assert.match(migration, /add column if not exists review text/i, "DB thiếu review");
assert.match(
  migration,
  /add column if not exists status text.*visible.*hidden/is,
  "DB thiếu status visible/hidden",
);
assert.match(migration, /score between 1 and 5/i, "DB phải giới hạn score 1-5");
assert.match(
  migration,
  /movie_ratings_cooldown.*60 seconds/is,
  "DB thiếu cooldown chống bỏ qua API",
);
assert.match(hook, /fetch\("\/api\/ratings"/, "client phải gọi API ratings");
assert.doesNotMatch(
  hook,
  /JSON\.stringify\([^)]*user_id|user_id\s*:\s*user/i,
  "client không được gửi user_id",
);
assert.match(ui, /textarea/, "UI thiếu textarea nhận xét");
assert.match(ui, /Đánh giá mới nhất/, "UI thiếu danh sách review");
assert.match(ui, /Cập nhật đánh giá|Sửa đánh giá/, "UI thiếu sửa review của mình");
assert.match(ui, /length: 5/, "UI phải dùng 5 sao");
assert.match(ui, /setScore\(data\?\.mine\?\.score \?\? 0\)/, "Đổi phim phải reset điểm cũ");
assert.match(ui, /\[slug, data\?\.mine\]/, "State rating phải cập nhật khi đổi phim");
assert.match(mcp, /max\(5\)/, "MCP rating vẫn cho phép quá 5 sao");
assert.match(mcp, /onConflict: "user_id,slug"/, "MCP phải dùng đúng unique key rating");
console.log("ratings review/spam check: PASS");
