import { readFileSync } from "node:fs";

const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

must(root.includes("async function recoverClient"), "Thiếu phục hồi lỗi client");
must(root.includes("navigator.serviceWorker.getRegistrations()"), "Chưa gỡ service worker lỗi/cũ");
must(root.includes("caches.keys()"), "Chưa xoá cache asset lỗi/cũ");
must(root.includes("error.message"), "Error boundary vẫn che nguyên nhân");
must(sw.includes('const VERSION = "lv-v2"'), "Service worker chưa tăng phiên bản cache");
console.log("mobile error recovery: PASS");
