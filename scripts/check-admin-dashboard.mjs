import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/routes/admin.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/routes/api/admin.ts", import.meta.url), "utf8");
const me = readFileSync(new URL("../src/routes/me.tsx", import.meta.url), "utf8");
assert(route.includes('createFileRoute("/admin")'));
assert(route.includes("Quản lý người dùng"));
assert(route.includes("Quản lý Watch Party"));
assert(api.includes('ADMIN_EMAIL = "lacviet55@proton.me"'));
assert(api.includes("verifyAdmin"));
assert(api.includes("listUsers"));
assert(api.includes("deleteUser"));
assert(me.includes('to="/admin"'));
console.log("admin dashboard check passed");
