import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";

const schema = `
create table if not exists public.watch_parties (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  slug text not null, source text not null default 'kkphim', name text not null, poster text,
  ep_index integer not null default 0, srv_index integer not null default 0,
  position_seconds double precision not null default 0, is_playing boolean not null default false,
  closed boolean not null default false, chat_mode text not null default 'all',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.watch_party_messages (
  id uuid primary key default gen_random_uuid(), party_id uuid not null references public.watch_parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, display_name text,
  content text not null check(char_length(content) between 1 and 500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.watch_party_members (
  id uuid primary key default gen_random_uuid(), party_id uuid not null references public.watch_parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), unique(party_id,user_id)
);
grant select,insert,update,delete on public.watch_parties,public.watch_party_messages to authenticated;
grant select,insert,delete on public.watch_party_members to authenticated;
alter table public.watch_parties enable row level security;
alter table public.watch_party_messages enable row level security;
alter table public.watch_party_members enable row level security;
drop policy if exists "Authenticated can view open parties" on public.watch_parties;
create policy "Authenticated can view open parties" on public.watch_parties for select to authenticated using(true);
drop policy if exists "Host can update party" on public.watch_parties;
create policy "Host can update party" on public.watch_parties for update to authenticated using(auth.uid()=host_id) with check(auth.uid()=host_id);
drop policy if exists "Authenticated can read party messages" on public.watch_party_messages;
create policy "Authenticated can read party messages" on public.watch_party_messages for select to authenticated using(true);
drop policy if exists "Users can send messages when chat allowed" on public.watch_party_messages;
create policy "Users can send messages when chat allowed" on public.watch_party_messages for insert to authenticated with check(auth.uid()=user_id);
`;

let pool: Pool | undefined;
let schemaReady = false;
const ADMIN_EMAIL = "lacviet55@proton.me";

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return (pool ??= new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 }));
}

async function currentUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY!, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string };
  return user.id ? user : null;
}

async function handler(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const uid = user.id;
    if (!schemaReady) {
      await db().query(schema);
      schemaReady = true;
    }
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "create") {
      const code = String(body.code ?? "");
      const { rows } = await db().query(
        `insert into public.watch_parties(code,host_id,slug,source,name,poster,ep_index,srv_index)
         values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
        [code, uid, body.slug, body.source, body.name, body.poster || null, body.ep ?? 0, body.srv ?? 0],
      );
      await db().query(
        `insert into public.watch_party_members(party_id,user_id) values($1,$2) on conflict(party_id,user_id) do nothing`,
        [rows[0].id, uid],
      );
      return Response.json({ party: rows[0] });
    }
    if (body.action === "join") {
      const { rows } = await db().query(
        `select * from public.watch_parties where code=upper(trim($1)) and closed=false limit 1`,
        [String(body.code ?? "")],
      );
      if (!rows[0]) return Response.json({ party: null });
      await db().query(
        `insert into public.watch_party_members(party_id,user_id) values($1,$2) on conflict(party_id,user_id) do nothing`,
        [rows[0].id, uid],
      );
      return Response.json({ party: rows[0] });
    }
    if (body.action === "chat-list") {
      const { rows } = await db().query(
        `select id,party_id,user_id,display_name,content,created_at from public.watch_party_messages
         where party_id=$1 order by created_at asc limit 200`,
        [String(body.partyId ?? "")],
      );
      return Response.json({ messages: rows });
    }
    if (body.action === "chat-send") {
      const partyId = String(body.partyId ?? "");
      const content = String(body.content ?? "").trim();
      if (!content || content.length > 500) return Response.json({ error: "Tin nhắn không hợp lệ" }, { status: 400 });
      const allowed = await db().query(
        `select 1 from public.watch_parties where id=$1 and closed=false and (chat_mode='all' or host_id=$2)`,
        [partyId, uid],
      );
      if (!allowed.rowCount) return Response.json({ error: "Phòng đã đóng hoặc chat đang bị khoá" }, { status: 403 });
      const { rows } = await db().query(
        `insert into public.watch_party_messages(party_id,user_id,display_name,content) values($1,$2,$3,$4) returning *`,
        [partyId, uid, String(body.displayName ?? "Khán giả").slice(0, 80), content],
      );
      return Response.json({ message: rows[0] });
    }
    if (body.action === "close") {
      const { rows } = await db().query(
        `update public.watch_parties set closed=true,updated_at=now() where id=$1 and (host_id=$2 or $3) returning code`,
        [String(body.partyId ?? ""), uid, user.email?.toLowerCase() === ADMIN_EMAIL],
      );
      if (!rows[0]) return Response.json({ error: "Chỉ chủ phòng hoặc Admin được đóng phòng" }, { status: 403 });
      return Response.json({ code: rows[0].code });
    }
    if (body.action === "sync") {
      const allowed = new Set(["ep_index", "srv_index", "position_seconds", "is_playing", "closed", "chat_mode"]);
      const patch = Object.entries((body.patch ?? {}) as Record<string, unknown>).filter(([key]) => allowed.has(key));
      if (!patch.length) return Response.json({ error: "Không có thay đổi" }, { status: 400 });
      const values = patch.map(([, value]) => value);
      const sets = patch.map(([key], index) => `${key}=$${index + 3}`).join(",");
      const { rows } = await db().query(
        `update public.watch_parties set ${sets},updated_at=now() where id=$1 and host_id=$2 returning *`,
        [String(body.partyId ?? ""), uid, ...values],
      );
      if (!rows[0]) return Response.json({ error: "Chỉ chủ phòng được điều khiển" }, { status: 403 });
      return Response.json({ party: rows[0] });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[watch-party]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/watch-party")({
  server: { handlers: { POST: ({ request }) => handler(request) } },
});
