import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const board = readFileSync(new URL("../src/components/GoldBoard.tsx", import.meta.url), "utf8");
const gold = readFileSync(new URL("../src/lib/gold.ts", import.meta.url), "utf8");
assert(gold.includes("_limit: 5"), "Bảng Vàng chưa giới hạn Top 5");
assert(board.includes("rows.slice(3, 5)"), "Bảng Vàng chưa lấy vị trí 4 và 5");
assert(board.includes("Vị trí 4–5"), "Bảng Vàng thiếu tiêu đề vị trí 4–5");
assert(!board.includes("4 - 10"), "Bảng Vàng vẫn hiển thị phạm vi 4–10 cũ");
console.log("gold board top five contract: PASS");
