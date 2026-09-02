import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/SourcePing.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");

assert(source.includes("PopoverTrigger"), "Bộ chọn nguồn phải thu gọn vào popover");
assert(home.includes("<SourcePing value={source} onChange={setSource}"), "Trang chủ thiếu bộ chọn nguồn gọn");
assert(home.includes('queryKey: ["latest", source, 1]'), "Trang chủ chưa tải đúng nguồn chọn thủ công");
assert(!home.includes("Cập nhật mỗi 30 giây"), "Trang chủ còn nhãn phụ làm bộ chọn nguồn cồng kềnh");
assert(source.includes("Đổi nguồn API"), "Nút nguồn thiếu nhãn thao tác rõ");
assert(source.includes("Chọn thủ công"), "Popover thiếu hướng dẫn chọn thủ công");
assert(source.includes("Nguồn đang dùng"), "Nút chưa làm nổi bật nguồn hiện tại");
assert(source.includes("aria-checked"), "Danh sách nguồn thiếu trạng thái accessible");
assert(source.includes("grid-cols-2"), "Danh sách nguồn mobile chưa đủ gọn");
assert(!source.includes("SOURCES.filter((s) => !sources || sources.includes(s.id)).map"), "Không được bung toàn bộ nguồn ngoài trang");

console.log("compact source picker: PASS");
