import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const player = read("src/components/Player.tsx");
const root = read("src/routes/__root.tsx");
const watch = read("src/routes/watch.$slug.tsx");
const gold = read("src/lib/gold.ts");
const css = read("src/styles.css");
const migrations = readdirSync(new URL("../supabase/migrations/", import.meta.url)).sort();
const latestMigration = read(`supabase/migrations/${migrations.at(-1)}`);

if (player.includes("requestPictureInPicture") || player.includes("Phát mini")) throw new Error("PiP native chưa được gỡ");
if (root.includes('label="Trang nhà"') || root.includes('label="Tìm phim"')) throw new Error("Menu header chưa được gỡ");
if (!watch.includes("availableSources") || !watch.includes("sourceMatch")) throw new Error("Chưa ẩn nguồn không có phim");
if (!gold.includes("canonicalMovieKey")) throw new Error("Thiếu khóa phim chuẩn hóa");
if (!latestMigration.includes("movie_key") || !latestMigration.includes("GROUP BY v.movie_key")) throw new Error("Bảng Vàng chưa gộp đa nguồn");
if (!css.includes("dynamic-glass-toast") || !css.includes("backdrop-filter: blur")) throw new Error("Thông báo chưa glass blur");
if (!css.includes("--primary: oklch(0.78 0.16 82)")) throw new Error("Theme chưa đen-vàng");
console.log("unified experience check: PASS");
