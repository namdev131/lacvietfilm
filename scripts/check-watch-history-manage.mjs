import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../src/routes/api/watch-history.ts");
const helper = read("../src/lib/watchHistoryApi.ts");
const page = read("../src/routes/history.tsx");

assert(api.includes('body.action === "delete"'), "Thiếu action xóa lịch sử");
assert(
  /delete from public\.watch_history where user_id=\$1 and slug=\$2/i.test(api),
  "Xóa lịch sử chưa scope theo user_id + slug",
);
assert(helper.includes('"delete"'), "Helper chưa hỗ trợ xóa lịch sử");
assert(page.includes("deleteHistoryItem"), "UI chưa gọi xóa từng mục qua API");
assert(page.includes('type="search"'), "UI thiếu ô tìm kiếm");
assert(page.includes('normalize("NFD")'), "Tìm kiếm chưa bỏ dấu");
assert(page.includes("/[đĐ]/g"), "Tìm kiếm chưa chuẩn hóa đ/Đ");
assert(page.includes("confirm("), "Xóa lịch sử thiếu xác nhận");
assert(page.includes("aria-label={`Xoá ${m.name}`}"), "Nút xóa thiếu nhãn accessible");
console.log("watch history management contract: PASS");
