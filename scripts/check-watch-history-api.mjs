import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../src/routes/api/watch-history.ts");
const userData = read("../src/hooks/useUserData.ts");
const progress = read("../src/lib/progress.ts");
const helper = read("../src/lib/watchHistoryApi.ts");
assert(api.includes('createFileRoute("/api/watch-history")'), "Thiếu API Watch History");
assert(helper.includes('fetch("/api/watch-history"'), "Helper chưa gọi API Watch History");
assert(api.includes("create table if not exists public.watch_history"), "API chưa tự tạo bảng");
for (const action of ["list", "record", "progress"])
  assert(api.includes(`body.action === "${action}"`), `Thiếu action ${action}`);
assert(api.includes("currentUser(request)"), "API thiếu xác thực người dùng");
assert(userData.includes('watchHistoryApi("list"'), "Hook chưa đọc lịch sử qua API server");
assert(userData.includes('watchHistoryApi("record"'), "Hook chưa ghi lịch sử qua API server");
assert(progress.includes('watchHistoryApi("progress"'), "Tiến độ chưa đồng bộ qua API server");
console.log("watch history API contract: PASS");
