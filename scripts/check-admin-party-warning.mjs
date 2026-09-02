import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../src/routes/api/admin.ts");
const page = read("../src/routes/admin.tsx");
const partyPage = read("../src/routes/party.$code.tsx");
const migration = read("../supabase/migrations/20260902000001_admin_watch_party_operations.sql");
const hook = read("../src/hooks/useWatchParty.ts");

assert(api.includes('action === "warnParty"'), "Admin API thiếu cảnh báo phòng");
assert(api.includes('can(actor, "watch_party.warn")'), "warnParty thiếu kiểm tra quyền server");
assert(api.includes('can(actor, "watch_party.close")'), "closeParty thiếu kiểm tra quyền server");
assert(api.includes('can(actor, "watch_party.view")'), "GET thiếu kiểm tra quyền server");
assert(api.includes('role === "deputy_admin"'), "Permission không giới hạn cho deputy");
assert(
  api.includes("begin") && api.includes("commit") && api.includes("rollback"),
  "Warn/close thiếu transaction",
);
assert(api.includes("interval '10 seconds'"), "Cảnh báo thiếu rate limit 10 giây");
assert(
  api.includes("watch_party_warnings") && api.includes("admin_audit_log"),
  "Admin API thiếu warning/audit",
);
assert(api.includes("p.join_locked"), "Dashboard API thiếu join_locked");
assert(!api.includes('action === "deleteParty"'), "Admin API vẫn cho xóa phòng");
assert(
  migration.includes("create table if not exists public.staff_permissions"),
  "Thiếu staff_permissions idempotent",
);
assert(
  migration.includes("char_length(message) between 1 and 300"),
  "DB thiếu giới hạn cảnh báo 300 ký tự",
);
assert(
  migration.includes("add column if not exists join_locked"),
  "Migration thiếu join_locked idempotent",
);
assert(
  !page.includes('action: "deleteParty"'),
  "Dashboard vẫn cho xóa phòng trong vận hành thường",
);
assert(page.includes('action: "warnParty"'), "Dashboard thiếu gửi cảnh báo");
assert(page.includes("refetchInterval"), "Dashboard thiếu tự làm mới phòng");
assert(page.includes("maxLength={300}"), "Form cảnh báo thiếu giới hạn 300 ký tự");
assert(page.includes('to="/party/$code"'), "Dashboard thiếu nút vào phòng");
assert(page.includes('action: "closeParty"'), "Dashboard thiếu nút đóng phòng");
assert(
  !api.includes('action === "bootstrapAdmin"'),
  "Admin API còn password oracle bootstrapAdmin",
);
assert(
  api.includes("insert into public.staff_permissions"),
  "Gắn Phó Admin chưa cấp quyền Watch Party",
);
assert(
  hook.includes('action: "chat-send"') && !hook.includes("displayName:"),
  "Client vẫn tự khai displayName chat",
);
assert(
  hook.includes("staff_role?") && partyPage.includes('m.staff_role ?? "member"'),
  "Chat vẫn suy quyền từ displayName",
);
assert(
  hook.includes("party-warnings-") && hook.includes('table: "watch_party_warnings"'),
  "Phòng thiếu cảnh báo realtime",
);
assert(
  migration.includes("alter publication supabase_realtime add table public.watch_party_warnings"),
  "Migration thiếu publication realtime cảnh báo",
);
assert(
  migration.includes('drop policy if exists "Users can send messages when chat allowed"'),
  "Migration còn policy chat permissive cũ",
);
assert(migration.includes("watch_party_messages.party_id"), "RLS chat chưa qualify outer party_id");
assert(
  migration.includes("watch_party_warnings.party_id"),
  "RLS warning chưa qualify outer party_id",
);
assert(
  migration.includes('drop policy if exists "Party members view parties"'),
  "Migration policy chưa idempotent",
);
console.log("admin party warning contract: PASS");
