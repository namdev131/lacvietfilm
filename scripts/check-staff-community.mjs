import { readFileSync } from "node:fs";
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../src/hooks/useWatchParty.ts", import.meta.url), "utf8");
const admin = readFileSync(new URL("../src/routes/admin.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/admin.ts", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(party.includes("staff-${joinedNotice.role}") && party.includes("staff-${staffNotice.role}"), "Thông báo tham gia chưa nhận lớp vai trò");
must(party.includes('"admin"') && party.includes('"deputy_admin"') && party.includes('"member"'), "Thiếu phân loại hiệu ứng vai trò");
must(party.includes("activityNotice"), "Thiếu thông báo hoạt động riêng");
must(hook.includes("event: \"join\"") && hook.includes("newPresences"), "Presence join sai");
must(admin.includes("Thống kê cộng đồng") && admin.includes("Vào phòng"), "Dashboard thiếu thống kê/thao tác phòng");
must(api.includes("message_count") && api.includes("member_count"), "Admin API thiếu thống kê phòng");
must(auth.includes("Chào mừng Lạc Việt Admin") && auth.includes("Chào mừng Phó Admin Lạc Việt"), "Thông báo đăng nhập staff chưa riêng");
must(styles.includes(".staff-admin") && styles.includes(".staff-deputy_admin"), "Thiếu CSS vai trò");
console.log("staff community contract: PASS");
