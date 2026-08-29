import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dock = readFileSync(new URL("../src/components/DockBar.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const keys = [...dock.matchAll(/\{ key: "(explore|history|contact|home|social|library|me)"/g)].map((match) => match[1]);
assert.deepEqual(keys, ["explore", "history", "contact", "home", "social", "library", "me"]);
assert(dock.includes("grid-cols-7"), "Dock phải chia 7 cột đối xứng");
assert(!dock.includes('animate={{ x: ["0%", "400%"] }}'), "Bỏ đường sáng chạy trên dock");
assert(!css.includes(".dock-bar::before"), "Bỏ đường vàng phía trên dock");
assert(!css.includes(".shelf-heading h2::before"), "Bỏ vạch vàng đen bị dock che phía trên");
console.log("dock symmetry check passed");
