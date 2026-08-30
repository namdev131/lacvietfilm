import { readFileSync } from "node:fs";

const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const data = readFileSync(new URL("../src/hooks/useUserData.ts", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(!dock.includes("ContinueWatching"), "DockBar vẫn hiển thị Xem tiếp thông minh");
for (const token of ["useHistory", 'title=\"Đã xem\"', "position_seconds", "duration_seconds", 'to=\"/watch/$slug\"']) {
  must(home.includes(token), `Trang chủ thiếu ${token}`);
}
must(home.indexOf('title="Đã xem"') < home.indexOf('title="Phim mới"'), "Đã xem phải nằm trên Phim mới");
must(home.includes("!item.finished"), "Đã xem chưa lọc phim đang xem dở");
must(!home.includes("(item.position_seconds ?? 0) > 30"), "Lịch sử cloud cũ có tiến độ 0 đang bị ẩn");
must(data.includes('.eq("user_id", user.id)'), "History chưa truy vấn rõ theo tài khoản đăng nhập");
must(data.includes('refetchOnMount: "always"'), "History chưa tự tải lại khi sang thiết bị/trở về trang");

console.log("home watch history contract: PASS");
