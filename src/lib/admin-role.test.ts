import { deepEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_DISPLAY_NAME, adminRole, canManageUser, partyIdentity } from "./admin-role.ts";

test("admin chính luôn mang tên và vai trò cố định", () => {
  equal(adminRole({ email: "LACVIET55@proton.me" }), "admin");
  deepEqual(partyIdentity({ id: "1", email: "lacviet55@proton.me", user_metadata: { display_name: "Tên khác" } }), {
    id: "1",
    name: ADMIN_DISPLAY_NAME,
    role: "admin",
  });
});

test("tài khoản được gắn phó admin có huy hiệu nhưng không thành admin chính", () => {
  equal(adminRole({ email: "pho@example.com", user_metadata: { app_role: "deputy_admin" } }), "deputy_admin");
  equal(partyIdentity({ id: "2", email: "pho@example.com", user_metadata: { app_role: "deputy_admin", display_name: "Minh" } }).role, "deputy_admin");
});

test("phó admin không thể tác động admin chính", () => {
  equal(canManageUser("deputy_admin", "admin"), false);
  equal(canManageUser("deputy_admin", "member"), true);
  equal(canManageUser("admin", "deputy_admin"), true);
});
