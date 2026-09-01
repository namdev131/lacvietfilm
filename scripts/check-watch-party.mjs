import { readFileSync } from "node:fs";

const hook = readFileSync(new URL("../src/hooks/useWatchParty.ts", import.meta.url), "utf8");
const button = readFileSync(
  new URL("../src/components/WatchPartyButton.tsx", import.meta.url),
  "utf8",
);
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const repair = readFileSync(new URL("../.hermes/watch-party-repair.sql", import.meta.url), "utf8");
const must = (ok, message) => {
  if (!ok) throw new Error(message);
};

must(hook.includes('fetch("/api/watch-party"'), "Tạo/vào phòng chưa đi qua API tự sửa schema");
must(!hook.includes('rpc("create_watch_party"'), "Tạo phòng vẫn gọi RPC dễ lỗi schema cache");
must(!hook.includes('rpc("join_party"'), "Vào phòng vẫn gọi RPC dễ lỗi schema cache");
must(hook.includes("joinedNotice"), "Presence thiếu thông báo người tham gia");
must(party.includes("watch-party-join"), "Phòng thiếu hiệu ứng người tham gia");
must(button.includes("disabled={create.isPending}"), "Nút tạo phòng chưa chặn bấm lặp");
must(button.includes("partyErrorMessage(error)"), "Toast tạo phòng chưa hiển thị lỗi thật");
must(styles.includes('[data-type="error"]'), "Toast lỗi chưa có màu/viền riêng");
must(styles.includes("rgb(255 255 255)"), "Toast sáng vẫn xuyên nền");
must(
  repair.includes("CREATE TABLE IF NOT EXISTS public.watch_parties"),
  "Thiếu repair schema Watch Party",
);
for (const action of [
  'body.action === "chat-list"',
  'body.action === "chat-send"',
  'body.action === "close"',
  'body.action === "sync"',
])
  must(api.includes(action), `API thiếu ${action}`);
must(hook.includes('partyApi({ action: "chat-send"'), "Chat vẫn ghi trực tiếp qua RLS");
must(hook.includes('partyApi({ action: "close"'), "Đóng phòng vẫn ghi trực tiếp qua RLS");
must(party.includes("host.stop()"), "Vào phòng chưa tắt PiP đang phát");
must(party.includes("navigator.share"), "Phòng thiếu Web Share cho nút Chia sẻ");
must(party.includes("navigator.clipboard"), "Nút Chia sẻ thiếu fallback clipboard");
must(
  party.includes('socialApi("friends-list"'),
  "Mời bạn chưa tải danh sách bạn bè qua social API",
);
must(party.includes('socialApi("party-invite"'), "Mời bạn chưa gửi lời mời qua social API");
must(party.includes("partyId: party.id"), "Lời mời thiếu partyId");
must(party.includes("code: party.code"), "Lời mời thiếu code");
must(party.includes("link: partyLink"), "Lời mời thiếu link");
must(
  /<button[^>]*>[\s\S]*?Chia sẻ[\s\S]*?<\/button>/.test(party),
  "Chủ phòng và thành viên thiếu nút Chia sẻ chung",
);
must(/<button[^>]*>[\s\S]*?Mời bạn[\s\S]*?<\/button>/.test(party), "Phòng thiếu nút Mời bạn");

console.log("watch party contract: PASS");
