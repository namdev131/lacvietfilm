import { readFileSync } from "node:fs";
const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");
const admin = readFileSync(new URL("../src/routes/admin.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/admin.ts", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(player.includes("overlay?: ReactNode"), "Player chưa nhận overlay trong fullscreen element");
must(player.includes("{overlay}"), "Player chưa render overlay trong frame");
must(party.includes("overlay={chatNotice}"), "Thông báo chat chưa nằm trong player fullscreen");
must(admin.includes('action: "assignParty"'), "Dashboard thiếu thao tác gắn người dùng vào phòng");
must(admin.includes("Chọn phòng Watch Party"), "Dashboard thiếu chọn phòng");
must(api.includes('action === "assignParty"'), "Admin API thiếu assignParty");
must(api.includes("watch_party_members"), "API chưa ghi membership");
console.log("fullscreen chat + assign party contract: PASS");
