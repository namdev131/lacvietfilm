import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const api = read("src/routes/api/episode-watcher.ts");
const follows = read("src/hooks/useFollows.ts");
const migrations = readdirSync(new URL("../supabase/migrations", import.meta.url))
  .map((name) => read(`supabase/migrations/${name}`))
  .join("\n");

assert.match(api, /authorization.*Bearer|Bearer.*authorization/is, "API phải xác thực Bearer");
assert.match(api, /\bBEGIN\b/i, "Mỗi observation phải chạy trong transaction");
assert.match(api, /FOR UPDATE/i, "Follow phải được row-lock trước khi cập nhật");
assert.match(
  api,
  /where user_id=\$1 and slug=\$2 for update/i,
  "Row lock phải scope user_id + slug",
);
assert.match(api, /follow\.source !== item\.source/, "Server phải xác minh source của follow");
assert.match(api, /await ensureSchema\(\)/, "API phải chuẩn bị schema dedupe");
assert.match(api, /ON CONFLICT[\s\S]*DO NOTHING/i, "Insert notification phải chống trùng");
assert.match(
  api,
  /catch[\s\S]*continue|catch[\s\S]*results\.push/is,
  "Lỗi một nguồn không được chặn nguồn khác",
);
assert.match(
  migrations,
  /episode_count[\s\S]*unique|unique[\s\S]*episode_count/i,
  "DB phải unique user+slug+episode_count",
);
assert.doesNotMatch(
  follows,
  /from\(["']notifications["']\)\.insert/,
  "Client tuyệt đối không insert notification",
);
assert.match(follows, /30\s*\*\s*60_000/, "Client trigger tối đa 30 phút");
assert.match(follows, /\/api\/episode-watcher/, "Client phải gửi observations tới server");
assert.match(
  follows,
  /response\.ok[\s\S]*localStorage\.setItem\(key/,
  "Chỉ throttle sau khi API thành công",
);
assert.doesNotMatch(
  api,
  /error instanceof Error \? error\.message/,
  "API không được lộ lỗi DB nội bộ",
);

console.log("episode notification dedupe checks passed");
