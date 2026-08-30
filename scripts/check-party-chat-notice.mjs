import { readFileSync } from "node:fs";
const hook = readFileSync(new URL("../src/hooks/useWatchParty.ts", import.meta.url), "utf8");
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(hook.includes("incomingMessage"), "Hook chưa phát hiện tin nhắn mới");
must(hook.includes("message.user_id !== user?.id"), "Thông báo chưa loại tin nhắn của chính mình");
must(party.includes('aria-label="Tin nhắn mới trong phòng"'), "Thiếu thông báo chat accessible");
must(party.includes("chat.incomingMessage.display_name"), "Thông báo thiếu tên người gửi");
must(party.includes("chat.incomingMessage.content"), "Thông báo thiếu nội dung động");
must(styles.includes(".watch-party-message-notice"), "Thiếu hiệu ứng thông báo chat");
console.log("party chat notice contract: PASS");
