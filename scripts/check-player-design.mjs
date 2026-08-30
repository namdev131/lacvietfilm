import { readFileSync } from "node:fs";

const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const watch = readFileSync(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8");
const host = readFileSync(new URL("../src/components/PlayerHost.tsx", import.meta.url), "utf8");
const quickSearch = readFileSync(new URL("../src/components/QuickSearch.tsx", import.meta.url), "utf8");
const dockBar = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");


for (const token of ["visibleWidth", "visibleHeight", "rect.bottom", "window.innerHeight"]) {
  if (!host.includes(token)) throw new Error(`PlayerHost thiếu chống đè: ${token}`);
}

for (const token of [
  'aria-label="Phát / Tạm dừng"',
  'aria-label="Tua lùi 10 giây"',
  'aria-label="Tua tới 10 giây"',
  'aria-label="Cài đặt phát"',
  'aria-label="Bật / Tắt âm"',
  'aria-label="Toàn màn hình"',
  'type="range"',
  'controls={false}',
  "seekPreview",
  "commitSeek",
  'onPointerUp={commitSeek}',
  "requestAnimationFrame",
  "stopLoad",
  "startLoad",
  "maxBufferLength: 20",
  "maxMaxBufferLength: 40",
  'onDoubleClick={requestFull}',
  'onClick={togglePlay}',
  'e.key === "ArrowUp"',
  'e.key.toLowerCase() === "m"',
  "seekingRef.current",
  "current: target",
]) {
  if (!player.includes(token)) throw new Error(`Player thiếu: ${token}`);
}
if ((player.match(/aria-label="Cài đặt phát"/g) || []).length !== 1) {
  throw new Error("Player phải có đúng một nút cài đặt phát");
}
for (const duplicate of ["Báo lỗi", 'aria-label="Danh sách tập"']) {
  if (player.includes(duplicate)) throw new Error(`Player còn chức năng trùng/không hoạt động: ${duplicate}`);
}
for (const token of [
  "Phím tắt",
  "Danh sách tập",
  "Nếu không xem được, hãy thử đổi máy chủ khác nhé!",
  "max-h-[calc(100dvh-8rem)]",
]) {
  if (!watch.includes(token)) throw new Error(`Trang xem thiếu: ${token}`);
}
for (const token of ["createPortal", "document.body"]) {
  if (!quickSearch.includes(token)) throw new Error(`QuickSearch thiếu lớp phủ portal: ${token}`);
  if (!dockBar.includes(token)) throw new Error(`DockBar thiếu lớp phủ portal: ${token}`);
}
console.log("player design check: PASS");
