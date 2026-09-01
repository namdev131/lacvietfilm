import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hook = readFileSync(new URL("../src/hooks/useWatchParty.ts", import.meta.url), "utf8");
const notice = readFileSync(new URL("../src/components/ActivePartyNotice.tsx", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");

assert(hook.includes('ACTIVE_PARTY_KEY = "lv-active-watch-party"'), "Thiếu lưu phòng đang xem");
assert(hook.includes('window.dispatchEvent(new Event("active-party-change"))'), "Thiếu đồng bộ thông báo trong cùng tab");
assert(notice.includes("Bạn đang trong 1 phòng xem chung"), "Thiếu nội dung thông báo");
assert(notice.includes("Vào lại"), "Thiếu nút Vào lại");
assert(notice.includes("Hủy"), "Thiếu nút Hủy");
assert(notice.includes('pathname === `/party/${party.code}`'), "Thông báo chưa ẩn khi đang ở trong phòng");
assert(root.includes("<ActivePartyNotice />"), "Thông báo chưa gắn toàn ứng dụng");

console.log("active party notice contract: PASS");
