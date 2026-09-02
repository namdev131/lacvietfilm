import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const url = (path) => new URL(path, import.meta.url);
const read = (path) => readFileSync(url(path), "utf8");
const page = read("../src/routes/achievements.tsx");
const me = read("../src/routes/me.tsx");

for (const text of [
  "SignInPrompt",
  'action: "achievements"',
  "authorization: `Bearer ${session.access_token}`",
  "Đang tải thành tích",
  "Không tải được thành tích",
  "Chưa có thành tích",
  "Đã mở khóa",
  "Chưa mở khóa",
  'role="progressbar"',
  "aria-valuenow",
  "aria-valuemax",
  "grid-cols-1",
  "sm:grid-cols-2",
])
  assert(page.includes(text), `UI thành tích thiếu: ${text}`);
assert.match(page, /achievements\.map/, "Trang thiếu danh sách huy hiệu từ API");
assert(page.includes("Boolean(achievement.unlockedAt)"), "Huy hiệu thiếu trạng thái mở/chưa mở");
for (const forbidden of ["leaderboard", "points", "rewards", "binge"])
  assert(!page.toLowerCase().includes(forbidden), `UI không được có ${forbidden}`);
assert(me.includes('to="/achievements"'), "Hồ sơ thiếu liên kết Thành tích");
assert(me.includes("Thành tích"), "Hồ sơ thiếu nhãn Thành tích");

const backendFiles = [
  "../src/lib/achievements.ts",
  "../src/routes/api/watch-history.ts",
  "../supabase/migrations/20260902000002_user_achievements.sql",
];
if (backendFiles.every((path) => existsSync(url(path)))) {
  const [model, api, migration] = backendFiles.map(read);
  for (const key of ["first-finish", "ten-finishes", "five-watch-days", "series-complete"])
    assert(model.includes(key), `Thiếu achievement ${key}`);
  assert(model.includes("progress"), "Achievement thiếu tiến độ xác định");
  assert(api.includes('body.action === "achievements"'), "API thiếu action achievements");
  assert(api.includes("user_achievements"), "API thiếu grant thành tích idempotent");
  assert.match(
    api,
    /on conflict\s*\(user_id,key\)\s*do nothing/i,
    "Grant thành tích chưa idempotent",
  );
  assert(
    api.includes("watch_completion_events"),
    "API thiếu event hoàn tất để giữ ngày xem chính xác",
  );
  assert(
    api.includes("movie_completed") && api.includes("filter (where movie_completed)"),
    "Đang tính xong một tập thành xong phim",
  );
  assert(
    api.includes("watch_day_count") && api.includes("filter (where movie_completed)"),
    "Mốc 5 ngày vẫn tính event chưa xác minh",
  );
  assert(
    api.includes("Number.isInteger(epIndex)") && api.includes("Number.isInteger(serverIndex)"),
    "API chưa validate chỉ số tập/server",
  );
  assert(api.includes("episode_count"), "API thiếu dữ liệu tin cậy cho hoàn tất series");
  assert(
    api.includes("fetchDetail") && api.includes("verifiedEpisodeCount"),
    "Server chưa xác minh tổng tập từ nguồn phim",
  );
  const player = read("../src/components/PlayerHost.tsx");
  const progress = read("../src/lib/progress.ts");
  const watch = read("../src/routes/watch.$slug.tsx");
  assert(player.includes("episodeCount"), "Player chưa chuyển tổng tập sang tiến độ");
  assert(progress.includes("episode_count"), "Progress chưa gửi tổng tập lên server");
  assert(
    watch.includes("episodeCount: currentServer?.items.length"),
    "Trang xem chưa cung cấp tổng tập tin cậy",
  );
  assert(!api.includes("body.user_id"), "API không được tin user_id client");
  assert(migration.includes("primary key (user_id, key)"), "DB thiếu unique grant idempotent");
  assert(migration.includes("watch_completion_events"), "Migration thiếu completion events");
  assert(migration.includes("enable row level security"), "Migration thiếu RLS");
}

console.log("achievements contract: PASS");
