import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
for (const token of [
  ".dynamic-glass-toast[data-sonner-toast]",
  "isolation: isolate",
  "overflow: hidden",
  "backdrop-filter: blur(20px)",
  '[data-theme="light"] .dynamic-glass-toast',
  '[data-theme="dark"] .dynamic-glass-toast',
  "prefers-reduced-transparency",
  ".dynamic-glass-toast [data-icon]",
  ".dynamic-glass-toast [data-title]",
]) {
  if (!css.includes(token)) throw new Error(`Toast glass thiếu: ${token}`);
}
for (const token of ["icons={{", "https://files.catbox.moe/g9s33j.svg", "https://files.catbox.moe/5vs8z4.svg"]) {
  if (!root.includes(token)) throw new Error(`Toast icon thiếu: ${token}`);
}
console.log("toast glass contract: PASS");
