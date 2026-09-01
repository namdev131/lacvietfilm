import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const badge = readFileSync(new URL("../src/components/CreditBadge.tsx", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");

assert(!badge.includes("Code by"), "Badge còn chữ Code by");
assert(badge.includes("bottom-4 right-4"), "Badge chưa nằm góc phải dưới");
assert(badge.includes(">Lạc Việt Film<"), "Badge thiếu tên Lạc Việt Film");
assert(!root.includes("Code bởi Nam NpT"), "Footer còn Code bởi Nam NpT");

console.log("brand credit contract: PASS");
