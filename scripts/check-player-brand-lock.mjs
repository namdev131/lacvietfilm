import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../src/components/PlayerHost.tsx", import.meta.url), "utf8");
const party = readFileSync(new URL("../src/routes/party.$code.tsx", import.meta.url), "utf8");

assert(player.includes('const PLAYER_LOGO = "https://files.catbox.moe/6ua430.png"'), "Player thiếu logo Catbox");
assert(player.includes("player-brand-watermark"), "Player thiếu watermark góc phải");
assert(player.includes("Lạc Việt Film"), "Watermark thiếu tên thương hiệu");
assert(player.includes("const [locked, setLocked] = useState(false)"), "Player thiếu trạng thái khóa");
assert(player.includes('aria-label="Khóa trình phát"'), "Thiếu nút khóa");
assert(player.indexOf('aria-label="Khóa trình phát"') > player.indexOf("player-chrome"), "Nút khóa phải chỉ nằm trong controls");
assert(player.includes('aria-label="Mở khóa trình phát"'), "Thiếu nút mở khóa");
assert(player.includes("player-lock-shield"), "Khóa chưa chặn tương tác player");
assert(player.includes('className="pointer-events-auto absolute right-3'), "Nút mở khóa chưa nằm bên phải");
assert(!player.includes('className="absolute left-1/2 top-3'), "Nút khóa còn nằm giữa");
assert(player.includes("pointer-events-none"), "Khóa chưa vô hiệu hóa công cụ");
assert(player.includes('className="player-title-poster'), "Tiêu đề thiếu poster");
assert(host.includes("poster={playback.poster}"), "PlayerHost chưa truyền poster");
assert(party.includes("poster={detail?.thumb || detail?.poster}"), "Watch Party chưa truyền poster");

console.log("player brand/lock contract: PASS");
