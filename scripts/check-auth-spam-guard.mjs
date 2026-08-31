import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const auth = readFileSync(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");
assert(auth.includes("useRef(false)"), "Thiếu khóa đồng bộ chống double-click");
assert(
  auth.includes("if (actionLocked.current || cooldown > 0) return"),
  "Submit chưa chặn khi đang xử lý/cooldown",
);
assert(auth.includes("AUTH_COOLDOWN_SECONDS"), "Thiếu thời gian chờ đăng nhập");
assert(auth.includes("EMAIL_COOLDOWN_SECONDS"), "Thiếu thời gian chờ cho thao tác gửi email");
assert(
  auth.includes("localStorage.setItem(AUTH_COOLDOWN_KEY"),
  "Cooldown chưa được lưu qua reload",
);
assert(auth.includes("Thử lại sau ${cooldown}s"), "Nút chưa hiển thị thời gian chờ");
assert(
  auth.includes("disabled={busy || cooldown > 0}"),
  "Nút đăng nhập chưa bị vô hiệu hóa trong cooldown",
);
console.log("auth spam guard contract: PASS");
