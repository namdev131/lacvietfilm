import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
assert(source.includes('label: "Liên hệ"'), "Dock thiếu mục Liên hệ");
assert(source.includes('label: "Xã hội"'), "Dock thiếu mục Xã hội");
assert(source.includes("mailto:lacviet55@proton.me"), "Góp ý chưa gửi tới email liên hệ");
assert(source.includes("Tính năng đang phát triển"), "Xã hội thiếu thông báo đang phát triển");
console.log("dock contact/social check passed");
