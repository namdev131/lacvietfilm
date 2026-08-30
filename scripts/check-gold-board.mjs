import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, "")];
    }),
);
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Thiếu cấu hình Supabase");

const response = await fetch(`${url}/rest/v1/rpc/gold_board`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ _period: "day", _kind: "all", _limit: 10 }),
});
if (!response.ok) throw new Error(`gold_board HTTP ${response.status}: ${await response.text()}`);
const rows = await response.json();
if (!Array.isArray(rows)) throw new Error("gold_board không trả về danh sách");
console.log(`gold board check: PASS (${rows.length} phim)`);
