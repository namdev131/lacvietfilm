import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";

const ADMIN_EMAIL = "lacviet55@proton.me";
let pool: Pool | undefined;

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return (pool ??= new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 }));
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

async function verifyAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string; app_metadata?: { role?: string } };
  return user.email?.toLowerCase() === ADMIN_EMAIL ? user : null;
}

async function listUsers() {
  const { rows } = await db().query(`
    select id, email, raw_user_meta_data->>'display_name' as display_name,
           case when lower(email)=$1 then 'admin'
                when raw_app_meta_data->>'role'='deputy_admin' then 'deputy_admin'
                else 'member' end as role,
           created_at, last_sign_in_at, banned_until
    from auth.users order by created_at desc limit 500
  `, [ADMIN_EMAIL]);
  return rows;
}

async function listParties() {
  const exists = await db().query(`select to_regclass('public.watch_parties') as name`);
  if (!exists.rows[0]?.name) return [];
  const { rows } = await db().query(`
    select p.id, p.code, p.name, p.host_id, u.email as host_email,
           p.closed, p.created_at, p.updated_at,
           (select count(*)::int from public.watch_party_members m where m.party_id=p.id) as member_count,
           (select count(*)::int from public.watch_party_messages x where x.party_id=p.id) as message_count
    from public.watch_parties p
    left join auth.users u on u.id = p.host_id
    order by p.created_at desc limit 300
  `);
  return rows;
}

async function handler(request: Request) {
  try {
    if (request.method === "POST") {
      const setup = (await request.clone().json()) as Record<string, unknown>;
      if (setup.action === "bootstrapAdmin") {
        const email = String(setup.email ?? "").trim().toLowerCase();
        const password = String(setup.password ?? "");
        if (email !== ADMIN_EMAIL || !password) return json({ error: "Forbidden" }, 403);
        const { rowCount } = await db().query(
          `update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()), updated_at=now()
           where lower(email)=$1 and encrypted_password=crypt($2, encrypted_password)`,
          [email, password],
        );
        return rowCount ? json({ ok: true }) : json({ error: "Sai tài khoản admin" }, 403);
      }
    }

    const admin = await verifyAdmin(request);
    if (!admin) return json({ error: "Forbidden" }, 403);


    if (request.method === "GET") return json({ users: await listUsers(), parties: await listParties() });
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "createUser") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const displayName = String(body.displayName ?? "").trim();
      if (!email || password.length < 6) return json({ error: "Email hoặc mật khẩu không hợp lệ" }, 400);
      const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY!, "content-type": "application/json" },
        body: JSON.stringify({ email, password, data: { display_name: displayName || email.split("@")[0] } }),
      });
      const result = await response.json();
      return response.ok ? json({ ok: true }) : json({ error: result.msg || result.message || "Không tạo được người dùng" }, response.status);
    }

    if (action === "updateUser") {
      const id = String(body.id ?? "");
      const email = String(body.email ?? "").trim().toLowerCase();
      const displayName = String(body.displayName ?? "").trim();
      if (!id || !email) return json({ error: "Thiếu dữ liệu" }, 400);
      const target = await db().query(`select lower(email) as email from auth.users where id=$1`, [id]);
      if (target.rows[0]?.email === ADMIN_EMAIL) return json({ error: "Không thể thao tác với Admin chính" }, 403);
      if (email === ADMIN_EMAIL) return json({ error: "Email này dành riêng cho Admin chính" }, 400);
      await db().query(
        `update auth.users set email=$2, raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('display_name',$3), updated_at=now() where id=$1`,
        [id, email, displayName],
      );
      await db().query(`update public.profiles set display_name=$2, updated_at=now() where id=$1`, [id, displayName]);
      return json({ ok: true });
    }

    if (action === "deleteUser") {
      const id = String(body.id ?? "");
      const target = await db().query(`select lower(email) as email from auth.users where id=$1`, [id]);
      if (!id || id === admin.id || target.rows[0]?.email === ADMIN_EMAIL) return json({ error: "Không thể thao tác với Admin chính" }, 403);
      await db().query(`delete from auth.users where id=$1`, [id]);
      return json({ ok: true });
    }

    if (action === "setDeputy") {
      if (admin.email?.toLowerCase() !== ADMIN_EMAIL) return json({ error: "Chỉ Admin chính được gắn Phó Admin" }, 403);
      const id = String(body.id ?? "");
      const enabled = body.enabled === true;
      const target = await db().query(`select lower(email) as email from auth.users where id=$1`, [id]);
      if (!target.rowCount) return json({ error: "Không tìm thấy tài khoản" }, 404);
      if (target.rows[0].email === ADMIN_EMAIL) return json({ error: "Không thể thao tác với Admin chính" }, 403);
      await db().query(
        enabled
          ? `update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"deputy_admin"}'::jsonb, updated_at=now() where id=$1`
          : `update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb) - 'role', updated_at=now() where id=$1`,
        [id],
      );
      return json({ ok: true });
    }

    if (action === "assignParty") {
      const userId = String(body.userId ?? "");
      const partyId = String(body.partyId ?? "");
      if (!userId || !partyId) return json({ error: "Thiếu người dùng hoặc phòng" }, 400);
      const party = await db().query(`select id from public.watch_parties where id=$1 and closed=false`, [partyId]);
      const target = await db().query(`select id from auth.users where id=$1`, [userId]);
      if (!party.rowCount) return json({ error: "Phòng không tồn tại hoặc đã đóng" }, 404);
      if (!target.rowCount) return json({ error: "Người dùng không tồn tại" }, 404);
      await db().query(`insert into public.watch_party_members(party_id,user_id) values($1,$2) on conflict(party_id,user_id) do nothing`, [partyId, userId]);
      return json({ ok: true });
    }

    if (action === "closeParty") {
      await db().query(`update public.watch_parties set closed=true, updated_at=now() where id=$1`, [String(body.id ?? "")]);
      return json({ ok: true });
    }

    if (action === "deleteParty") {
      await db().query(`delete from public.watch_parties where id=$1`, [String(body.id ?? "")]);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("[admin]", error);
    return json({ error: error instanceof Error ? error.message : "Server error" }, 500);
  }
}

export const Route = createFileRoute("/api/admin")({
  server: { handlers: { GET: ({ request }) => handler(request), POST: ({ request }) => handler(request) } },
});
