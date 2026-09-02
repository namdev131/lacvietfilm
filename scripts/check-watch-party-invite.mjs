import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8");
const has = (value, message) => assert(api.includes(value), message);

assert.match(
  api,
  /\.trim\(\)\s*\.toUpperCase\(\)/,
  "Create/join phải normalize code bằng upper(trim)",
);
has('body.action === "members-list"', "Thiếu action members-list");
has("p.display_name", "members-list thiếu display name");
has("m.user_id", "members-list thiếu member id");
console.log("watch party invite contract: PASS");
