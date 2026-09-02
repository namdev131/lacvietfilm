import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const hook = read("../src/hooks/useWatchParty.ts");
const page = read("../src/routes/party.$code.tsx");

assert(hook.includes("join_locked"), "Party type thiếu trạng thái khóa phòng");
assert(hook.includes('action: "members-list"'), "Hook thiếu danh sách thành viên");
assert(hook.includes('action: "set-lock"'), "Hook thiếu khóa/mở phòng");
assert(hook.includes('action: "transfer-host"'), "Hook thiếu chuyển chủ phòng");
assert(hook.includes('action: "warnings-list"'), "Hook thiếu cảnh báo phòng");
assert(page.includes("navigator.share"), "Chia sẻ thiếu Web Share");
assert(page.includes("navigator.clipboard"), "Chia sẻ thiếu fallback clipboard");
assert(page.includes("Khóa phòng") && page.includes("Mở phòng"), "UI thiếu khóa/mở phòng");
assert(page.includes("Chuyển chủ phòng"), "UI thiếu chuyển chủ phòng");
assert(page.includes("confirm("), "Chuyển chủ phòng thiếu xác nhận");
assert(page.includes("watch-party-warning"), "UI thiếu cảnh báo Admin");
assert(page.includes("host.stop()"), "Phòng chưa tắt mini-player/PiP toàn cục");
console.log("watch party advanced UI contract: PASS");
