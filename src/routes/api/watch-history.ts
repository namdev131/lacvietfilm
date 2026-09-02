import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";
import { achievementProgress } from "@/lib/achievements";
import { fetchDetail } from "@/lib/api";
import type { SourceId } from "@/lib/types";

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
create table if not exists public.watch_completion_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source text not null, slug text not null, episode_key text not null,
  completed_at timestamptz not null default now(), series_completed boolean not null default false,
  movie_completed boolean not null default false,
  unique(user_id,source,slug,episode_key)
);
alter table public.watch_completion_events add column if not exists movie_completed boolean not null default false;
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null, unlocked_at timestamptz not null default now(), primary key(user_id,key)
);
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
const SOURCES = new Set<SourceId>([
  "kkphim", "ophim", "nguonc", "vsmov",
  "rapchieuphim", "aiphim", "thuongkhung3d", "animapper",
]);

async function verifiedEpisodeCount(slug: string, source: string, serverIndex: number) {
  if (!SOURCES.has(source as SourceId) || !Number.isInteger(serverIndex) || serverIndex < 0)
    return null;
  try {
    const count = (await fetchDetail(slug, source as SourceId)).servers[serverIndex]?.items.length;
    return count && count > 0 ? count : null;
  } catch {
    return null;
  }
}

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
    if (body.action === "achievements") {
      const client = await db().connect();
      try {
        await client.query("begin");
        const {
          rows: [metrics],
        } = await client.query(
          `select count(distinct slug) filter (where movie_completed)::int finish_count,
                  count(distinct (completed_at at time zone 'Asia/Ho_Chi_Minh')::date)
                    filter (where movie_completed)::int watch_day_count,
                  coalesce(bool_or(series_completed),false) series_complete
           from public.watch_completion_events where user_id=$1`,
          [uid],
        );
        const earned = [
          metrics.finish_count >= 1 && "first-finish",
          metrics.finish_count >= 10 && "ten-finishes",
          metrics.watch_day_count >= 5 && "five-watch-days",
          metrics.series_complete && "series-complete",
        ].filter(Boolean) as string[];
        for (const key of earned)
          await client.query(
            `insert into public.user_achievements(user_id,key) values($1,$2)
             on conflict(user_id,key) do nothing`,
            [uid, key],
          );
        const { rows: grants } = await client.query(
          `select key,unlocked_at from public.user_achievements where user_id=$1`,
          [uid],
        );
        await client.query("commit");
        const unlocked = new Map(
          grants.map((row) => [row.key as string, row.unlocked_at as string]),
        );
        const progress = achievementProgress(
          metrics.finish_count,
          metrics.watch_day_count,
          new Set(unlocked.keys()),
        );
        return Response.json({
          achievements: progress.map(({ definition, progress: value }) => ({
            ...definition,
            icon:
              definition.key === "series-complete"
                ? "◆"
                : definition.key === "five-watch-days"
                  ? "✦"
                  : "★",
            progress: value,
            unlockedAt: unlocked.get(definition.key) ?? null,
          })),
        });
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }
    if (body.action === "delete") {
      const slug = text(body.slug, 300);
      if (!slug) return Response.json({ error: "Phim không hợp lệ" }, { status: 400 });
      await db().query(`delete from public.watch_history where user_id=$1 and slug=$2`, [
        uid,
        slug,
      ]);
      return Response.json({ ok: true });
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
        duration = Math.max(0, number(body.duration)),
        epIndex = Number(body.ep),
        serverIndex = Number(body.srv),
        episodeCount = Number(body.episode_count);
      const finished = duration > 60 && position >= duration - 60;
      if (
        !Number.isInteger(epIndex) ||
        epIndex < 0 ||
        !Number.isInteger(serverIndex) ||
        serverIndex < 0 ||
        (body.episode_count !== undefined &&
          (!Number.isInteger(episodeCount) || episodeCount < 1 || episodeCount > 10000))
      )
        return Response.json({ error: "Chỉ số tập hoặc server không hợp lệ" }, { status: 400 });
      const trustedEpisodeCount = finished
        ? await verifiedEpisodeCount(slug, source, serverIndex)
        : null;
      const client = await db().connect();
      try {
        await client.query("begin");
        await client.query(
          `insert into public.watch_history(user_id,slug,name,poster,source,episode_slug,episode_name,ep_index,srv_index,position_seconds,duration_seconds,finished,watched_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now()) on conflict(user_id,slug) do update set name=excluded.name,poster=excluded.poster,source=excluded.source,episode_slug=excluded.episode_slug,episode_name=excluded.episode_name,ep_index=excluded.ep_index,srv_index=excluded.srv_index,position_seconds=excluded.position_seconds,duration_seconds=excluded.duration_seconds,finished=excluded.finished,watched_at=now()`,
          [
            uid,
            slug,
            name,
            text(body.poster, 1000),
            source,
            text(body.episode_slug, 300),
            text(body.episode_name, 300),
            epIndex,
            number(body.srv),
            position,
            duration,
            finished,
          ],
        );
        if (finished) {
          const episodeKey = text(body.episode_slug, 300) ?? `ep:${epIndex}`;
          const seriesCompleted =
            trustedEpisodeCount !== null && epIndex + 1 === trustedEpisodeCount;
          await client.query(
            `insert into public.watch_completion_events(user_id,source,slug,episode_key,series_completed,movie_completed)
             values($1,$2,$3,$4,$5,$5)
             on conflict(user_id,source,slug,episode_key) do update
             set series_completed=public.watch_completion_events.series_completed or excluded.series_completed,
                 movie_completed=public.watch_completion_events.movie_completed or excluded.movie_completed`,
            [uid, source, slug, episodeKey, seriesCompleted],
          );
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
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
