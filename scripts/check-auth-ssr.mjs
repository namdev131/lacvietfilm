import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");
assert(!/const redirectTo = next \? `\$\{window\.location\.origin\}/.test(source), "Auth route must not read window during SSR");
console.log("auth SSR check passed");
