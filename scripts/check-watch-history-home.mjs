import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const userData = read("../src/hooks/useUserData.ts");
const watch = read("../src/routes/watch.$slug.tsx");
const home = read("../src/routes/index.tsx");
const progress = read("../src/lib/progress.ts");
assert(userData.includes("throw error"), "recordHistory đang nuốt lỗi đồng bộ");
assert(watch.includes("recordHistory(user.id"), "Trang xem chưa ghi Watch History");
assert(
  watch.includes('invalidateQueries({ queryKey: ["history"] })'),
  "Ghi lịch sử chưa làm mới cache",
);
assert(
  progress.includes('window.dispatchEvent(new CustomEvent("lv-history-sync")'),
  "Tiến độ chưa báo cache lịch sử cập nhật",
);
assert(
  home.includes("const watchedHistory = (history ?? []).slice(0, 12)"),
  "Trang chủ chưa lấy phim đã xem",
);
assert(
  home.includes('<HomeHistoryRow title="Đã xem" items={watchedHistory} />'),
  "Trang chủ thiếu mục Đã xem",
);
assert(!home.includes("filter((item) => !item.finished)"), "Trang chủ vẫn loại phim đã xem xong");
console.log("watch history/home contract: PASS");
