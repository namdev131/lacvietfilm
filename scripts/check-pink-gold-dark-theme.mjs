import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const settings = readFileSync(new URL("../src/lib/settings.tsx", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");

assert(settings.includes('theme: "dark",'), "Dark mode chưa là mặc định");
assert(root.includes('<html lang="vi" data-theme="dark" className="dark"'), "SSR chưa mặc định dark");
for (const token of ["--rose", "--gold-warm", "--accent-blend"]) assert(css.includes(token), `Thiếu token ${token}`);
assert(css.includes("linear-gradient(135deg, var(--rose), var(--gold-warm))"), "Thiếu gradient hồng vàng chính");
assert(css.includes('[data-theme="dark"]'), "Thiếu dark theme");
assert(css.includes('[data-theme="light"]'), "Thiếu light theme");

console.log("pink/gold dark theme contract: PASS");
