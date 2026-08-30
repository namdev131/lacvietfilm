import { readFileSync } from "node:fs";

const bell = readFileSync(new URL("../src/components/NotificationBell.tsx", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(!bell.includes("useUnreadCount"), "Chuông gọi useNotifications hai lần, dùng trùng Realtime channel");
must(bell.includes("data?.filter((item) => !item.read).length"), "Thiếu bộ đếm chưa đọc từ query hiện có");
console.log("notification channel contract: PASS");
