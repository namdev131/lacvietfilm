import { readFileSync } from "node:fs";
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(party.includes('const canCloseParty = isHost || myRole === "admin"'), "UI chưa cho Admin đóng phòng");
must(party.includes("{canCloseParty &&"), "Nút đóng phòng chưa dựa vào quyền Admin");
must(api.includes("email?.toLowerCase() === ADMIN_EMAIL"), "API chưa xác minh Admin chính");
must(api.includes("host_id=$2 or $3"), "API chỉ cho chủ phòng đóng");
must(api.includes("Chỉ chủ phòng hoặc Admin"), "Thông báo quyền đóng phòng chưa đúng");
console.log("admin close party contract: PASS");
