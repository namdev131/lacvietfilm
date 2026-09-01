import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const board = readFileSync(new URL("../src/components/GoldBoard.tsx", import.meta.url), "utf8");

assert(board.includes("ArrowUp"), "Bảng Vàng thiếu mũi tên tăng hạng");
assert(board.includes("ArrowDown"), "Bảng Vàng thiếu mũi tên giảm hạng");
assert(board.includes("row.prev_rank > row.rank"), "Chưa nhận diện phim tăng hạng");
assert(board.includes("row.prev_rank < row.rank"), "Chưa nhận diện phim giảm hạng");
assert(board.includes('aria-label={`Tăng ${row.prev_rank - row.rank} hạng`}'), "Mũi tên tăng thiếu mô tả mức thay đổi");
assert(board.includes('aria-label={`Giảm ${row.rank - row.prev_rank} hạng`}'), "Mũi tên giảm thiếu mô tả mức thay đổi");
assert(board.includes("text-emerald-400"), "Tăng hạng chưa dùng màu xanh");
assert(board.includes("text-red-400"), "Giảm hạng chưa dùng màu đỏ");

console.log("gold board rank movement contract: PASS");
