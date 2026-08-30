import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../.output/public/assets/", import.meta.url);
const files = readdirSync(dir);
const js = files.filter((file) => file.endsWith(".js")).map((file) => readFileSync(new URL(file, dir), "utf8")).join("\n");
const css = files.filter((file) => file.endsWith(".css")).map((file) => readFileSync(new URL(file, dir), "utf8")).join("\n");

assert.ok(!/\?\.(?!\d)/.test(js), "Tizen build still contains optional chaining");
assert.ok(!js.includes("??"), "Tizen build still contains nullish coalescing");
assert.ok(!/\|\|=|&&=|\?\?=/.test(js), "Tizen build still contains logical assignment");
assert.ok(!/oklch\(/.test(css), "Tizen CSS still contains unsupported OKLCH colors");
assert.ok(!/\d+(?:\.\d+)?dvh/.test(css), "Tizen CSS still contains unsupported dvh units");
assert.match(css, /body\{[^}]*min-height:100vh/, "Body needs a Tizen-compatible viewport height");
assert.match(css, /\.heritage-hero\{[^}]*min-height:68vh/, "Hero needs a Tizen-compatible viewport height");
console.log("Tizen compatibility check passed");
