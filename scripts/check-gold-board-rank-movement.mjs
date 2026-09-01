import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const board = readFileSync(new URL("../src/components/GoldBoard.tsx", import.meta.url), "utf8");

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert(board.includes('<span className="rank-chevrons"'), "Bảng Vàng thiếu cụm ba mũi tên");
assert(board.includes("row.prev_rank > row.rank"), "Chưa nhận diện phim tăng hạng");
assert(board.includes("row.prev_rank < row.rank"), "Chưa nhận diện phim giảm hạng");
assert(board.includes('aria-label={`Tăng ${row.prev_rank - row.rank} hạng`}'), "Mũi tên tăng thiếu mô tả mức thay đổi");
assert(board.includes('aria-label={`Giảm ${row.rank - row.prev_rank} hạng`}'), "Mũi tên giảm thiếu mô tả mức thay đổi");
assert(styles.includes("color: #43f353"), "Tăng hạng chưa dùng màu xanh");
assert(styles.includes("color: #ff3b32"), "Giảm hạng chưa dùng màu đỏ");
assert(styles.includes("top: .65rem; right: .65rem"), "Biến động hạng chưa nằm ở góc trên bên phải");
assert(styles.includes("border: 1px solid currentColor"), "Biến động hạng thiếu border tương phản");
assert(styles.includes("background: rgb(5 7 9 / .82)"), "Biến động hạng thiếu nền box dễ đọc");
assert(styles.includes("@keyframes rank-chevron"), "Mũi tên chưa có chuyển động");

console.log("gold board rank movement contract: PASS");
