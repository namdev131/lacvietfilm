import { readFileSync } from "node:fs";
const page = readFileSync(new URL("../src/routes/contact.tsx", import.meta.url), "utf8");
const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
for (const token of ['createFileRoute("/contact")', 'type="email"', "minLength={10}", "encodeURIComponent", "Gửi qua email", "không lưu nội dung biểu mẫu"]) {
  if (!page.includes(token)) throw new Error(`Trang liên hệ thiếu: ${token}`);
}
if (!dock.includes('to: "/contact"')) throw new Error("DockBar chưa dẫn tới trang liên hệ");
if (dock.includes('action: "contact"')) throw new Error("DockBar còn popup liên hệ cũ");
console.log("contact page contract: PASS");
