import { readFileSync } from "node:fs";

const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const watch = readFileSync(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8");

for (const token of [
  'aria-label="Phát / Tạm dừng"',
  'aria-label="Tua lùi 10 giây"',
  'aria-label="Phát mini"',
  'aria-label="Toàn màn hình"',
  'type="range"',
  'controls={false}',
]) {
  if (!player.includes(token)) throw new Error(`Player thiếu: ${token}`);
}
for (const token of ["Phím tắt", "Danh sách tập", "Nếu không xem được, hãy thử đổi máy chủ khác nhé!"]) {
  if (!watch.includes(token)) throw new Error(`Trang xem thiếu: ${token}`);
}
console.log("player design check: PASS");
