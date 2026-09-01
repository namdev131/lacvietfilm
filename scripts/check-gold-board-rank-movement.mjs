import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const board = readFileSync(new URL("../src/components/GoldBoard.tsx", import.meta.url), "utf8");

assert(board.includes("ArrowUp"), "Bảng Vàng thiếu mũi tên tăng hạng");
assert(board.includes("ArrowDown"), "Bảng Vàng thiếu mũi tên giảm hạng");
assert(board.includes("row.prev_rank > row.rank"), "Chưa nhận diện phim tăng hạng");
assert(board.includes("row.prev_rank < row.rank"), "Chưa nhận diện phim giảm hạng");
assert(board.includes('aria-label={`Tăng ${row.prev_rank - row.rank} hạng`}'), "Mũi tên tăng thiếu mô tả mức thay đổi");
assert(board.includes('aria-label={`Giảm ${row.rank - row.prev_rank} hạng`}'), "Mũi tên giảm thiếu mô tả mức thay đổi");
assert(board.includes("bg-emerald-600"), "Tăng hạng chưa dùng màu xanh");
assert(board.includes("bg-red-600"), "Giảm hạng chưa dùng màu đỏ");
assert(board.includes('className="rank-movement rank-up absolute bottom-20 left-2'), "Badge tăng phải nằm sát số hạng");
assert(board.includes('className="rank-movement rank-down absolute bottom-20 left-2'), "Badge giảm phải nằm sát số hạng");

console.log("gold board rank movement contract: PASS");
