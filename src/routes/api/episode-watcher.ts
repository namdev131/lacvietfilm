import { createFileRoute } from "@tanstack/react-router";
import { Pool, type PoolClient } from "pg";

let pool: Pool | undefined;
let schemaReady = false;
function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return (pool ??= new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 }));
}
async function ensureSchema() {
  if (schemaReady) return;
  await db().query(`
    alter table public.notifications add column if not exists episode_count integer;
    create unique index if not exists notifications_episode_dedupe
      on public.notifications(user_id,slug,episode_count) where episode_count is not null;
  `);
  schemaReady = true;
}

async function currentUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return ((await response.json()) as { id?: string }).id ?? null;
}

type Observation = { slug: string; source: string; episodeCount: number; episodeCurrent?: string };
function observation(value: unknown): Observation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const source = typeof item.source === "string" ? item.source.trim() : "";
  const episodeCount = Number(item.episodeCount);
  const episodeCurrent =
    typeof item.episodeCurrent === "string" ? item.episodeCurrent.trim().slice(0, 200) : undefined;
  if (
    !slug ||
    slug.length > 300 ||
    !source ||
    source.length > 30 ||
    !Number.isInteger(episodeCount) ||
    episodeCount < 0
  )
    return null;
  return { slug, source, episodeCount, episodeCurrent };
}

async function processObservation(client: PoolClient, uid: string, item: Observation) {
  await client.query("BEGIN");
  try {
    const { rows } = await client.query(
      `select name,poster,source,known_episodes from public.series_follows
       where user_id=$1 and slug=$2 for update`,
      [uid, item.slug],
    );
    const follow = rows[0] as
      { name: string; poster: string | null; source: string; known_episodes: number } | undefined;
    if (!follow) throw new Error("Follow not found");
    if (follow.source !== item.source) throw new Error("Source mismatch");

    let notified = false;
    if (item.episodeCount > follow.known_episodes) {
      const inserted = await client.query(
        `insert into public.notifications(user_id,title,body,slug,source,poster,episode_count)
         values($1,$2,$3,$4,$5,$6,$7)
         on conflict(user_id,slug,episode_count) where episode_count is not null do nothing
         returning id`,
        [
          uid,
          `${follow.name} có tập mới`,
          `Đã cập nhật tới tập ${item.episodeCount}${item.episodeCurrent ? ` · ${item.episodeCurrent}` : ""}`,
          item.slug,
          follow.source,
          follow.poster,
          item.episodeCount,
        ],
      );
      notified = inserted.rowCount === 1;
      await client.query(
        `update public.series_follows set known_episodes=greatest(known_episodes,$3),last_checked_at=now()
         where user_id=$1 and slug=$2`,
        [uid, item.slug, item.episodeCount],
      );
    } else {
      await client.query(
        `update public.series_follows set last_checked_at=now() where user_id=$1 and slug=$2`,
        [uid, item.slug],
      );
    }
    await client.query("COMMIT");
    return { slug: item.slug, ok: true, notified };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function handler(request: Request) {
  try {
    await ensureSchema();
    const uid = await currentUser(request);
    if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { observations?: unknown };
    if (!Array.isArray(body.observations) || body.observations.length > 100)
      return Response.json({ error: "Observations không hợp lệ" }, { status: 400 });

    const results: Array<{ slug?: string; ok: boolean; notified?: boolean; error?: string }> = [];
    for (const raw of body.observations) {
      const item = observation(raw);
      if (!item) {
        results.push({ ok: false, error: "Observation không hợp lệ" });
        continue;
      }
      const client = await db().connect();
      try {
        results.push(await processObservation(client, uid, item));
      } catch (error) {
        console.error("[episode-watcher:item]", item.slug, error);
        results.push({
          slug: item.slug,
          ok: false,
          error: "Không kiểm tra được phim này",
        });
        continue;
      } finally {
        client.release();
      }
    }
    return Response.json({ results }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[episode-watcher]", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/episode-watcher")({
  server: { handlers: { POST: ({ request }) => handler(request) } },
});
