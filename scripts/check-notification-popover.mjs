import { readFileSync } from "node:fs";

const bell = readFileSync(new URL("../src/components/NotificationBell.tsx", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(bell.includes('onClick={() => setOpen((value) => !value)}'), "Chuông vẫn điều hướng sang trang khác");
for (const token of ["useNotifications", "useMarkNotifications", 'role="dialog"', 'aria-label="Bảng thông báo"', "Không có thông báo", "Xem tất cả thông báo", "AnimatePresence"]) {
  must(bell.includes(token), `Bảng thông báo thiếu ${token}`);
}
must(bell.includes("pointerdown"), "Bảng thông báo chưa đóng khi bấm ra ngoài");

console.log("notification popover contract: PASS");
