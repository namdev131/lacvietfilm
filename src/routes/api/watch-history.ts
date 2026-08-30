import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";

const schema = `
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null, name text not null, poster text, source text not null default 'kkphim',
  episode_slug text, episode_name text, watched_at timestamptz not null default now(),
  position_seconds numeric not null default 0, duration_seconds numeric not null default 0,
  ep_index integer not null default 0, srv_index integer not null default 0,
  finished boolean not null default false, unique(user_id,slug)
);
create index if not exists watch_history_user_time on public.watch_history(user_id,watched_at desc);
`;
let pool: Pool | undefined;
let ready = false;
function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return (pool ??= new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 }));
}
async function currentUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
}
const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
const number = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

async function handler(request: Request) {
  try {
    const uid = await currentUser(request);
    if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!ready) {
      await db().query(schema);
      ready = true;
    }
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "list") {
      const { rows } = await db().query(
        `select slug,name,poster,source,episode_slug,episode_name,watched_at,position_seconds::float8,duration_seconds::float8,ep_index,srv_index,finished from public.watch_history where user_id=$1 order by watched_at desc limit 60`,
        [uid],
      );
      return Response.json({ history: rows });
    }
    const slug = text(body.slug, 300),
      name = text(body.name, 300),
      source = text(body.source, 30);
    if (!slug || !name || !source)
      return Response.json({ error: "Dữ liệu lịch sử không hợp lệ" }, { status: 400 });
    if (body.action === "record") {
      await db().query(
        `insert into public.watch_history(user_id,slug,name,poster,source,episode_slug,episode_name,ep_index,srv_index,watched_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,now()) on conflict(user_id,slug) do update set name=excluded.name,poster=excluded.poster,source=excluded.source,episode_slug=excluded.episode_slug,episode_name=excluded.episode_name,ep_index=excluded.ep_index,srv_index=excluded.srv_index,watched_at=now()`,
        [
          uid,
          slug,
          name,
          text(body.poster, 1000),
          source,
          text(body.episode_slug, 300),
          text(body.episode_name, 300),
          number(body.ep_index),
          number(body.srv_index),
        ],
      );
      return Response.json({ ok: true });
    }
    if (body.action === "progress") {
      const position = Math.max(0, number(body.position)),
        duration = Math.max(0, number(body.duration));
      const finished = duration > 60 && position >= duration - 60;
      await db().query(
        `insert into public.watch_history(user_id,slug,name,poster,source,episode_slug,episode_name,ep_index,srv_index,position_seconds,duration_seconds,finished,watched_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now()) on conflict(user_id,slug) do update set name=excluded.name,poster=excluded.poster,source=excluded.source,episode_slug=excluded.episode_slug,episode_name=excluded.episode_name,ep_index=excluded.ep_index,srv_index=excluded.srv_index,position_seconds=excluded.position_seconds,duration_seconds=excluded.duration_seconds,finished=excluded.finished,watched_at=now()`,
        [
          uid,
          slug,
          name,
          text(body.poster, 1000),
          source,
          text(body.episode_slug, 300),
          text(body.episode_name, 300),
          number(body.ep),
          number(body.srv),
          position,
          duration,
          finished,
        ],
      );
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[watch-history]", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
export const Route = createFileRoute("/api/watch-history")({
  server: { handlers: { POST: ({ request }) => handler(request) } },
});
