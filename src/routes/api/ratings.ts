import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";

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
    alter table public.movie_ratings add column if not exists review text;
    alter table public.movie_ratings add column if not exists status text not null default 'visible';
    update public.movie_ratings set score=5 where score>5;
  `);
  schemaReady = true;
}
async function currentUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
}
const clean = (value: unknown, max: number) => {
  const result = typeof value === "string" ? value.trim() : "";
  return result && result.length <= max ? result : null;
};
const bad = (error: string, status = 400) => Response.json({ error }, { status });

async function list(request: Request) {
  const url = new URL(request.url);
  const slug = clean(url.searchParams.get("slug"), 300);
  if (!slug) return bad("Phim không hợp lệ");
  const uid = await currentUser(request);
  const { rows: reviews } = await db().query(
    `select r.user_id,r.score,r.review,r.updated_at,coalesce(p.display_name,'Thành viên') as display_name
     from public.movie_ratings r left join public.profiles p on p.id=r.user_id
     where r.slug=$1 and r.status = 'visible' and r.review is not null
     order by updated_at desc limit 30`,
    [slug],
  );
  const { rows: summary } = await db().query(
    `select coalesce(avg(score),0)::float8 as avg,count(*)::int as count
     from public.movie_ratings where slug=$1 and status='visible'`,
    [slug],
  );
  const mine = uid
    ? ((
        await db().query(
          `select score,review,status,updated_at from public.movie_ratings where user_id=$1 and slug=$2`,
          [uid, slug],
        )
      ).rows[0] ?? null)
    : null;
  return Response.json({ ...summary[0], mine, reviews });
}

async function save(request: Request) {
  const uid = await currentUser(request);
  if (!uid) return bad("Unauthorized", 401);
  const body = (await request.json()) as Record<string, unknown>;
  const slug = clean(body.slug, 300);
  const name = clean(body.name, 300);
  const source = clean(body.source, 30);
  const score = Number(body.score);
  if (!slug || !name || !source || !Number.isInteger(score) || score < 1 || score > 5)
    return bad("Dữ liệu đánh giá không hợp lệ");
  const review = typeof body.review === "string" ? body.review.trim() : "";
  if (review.length > 1000) return bad("Nhận xét tối đa 1000 ký tự");
  const { rows } = await db().query(
    `insert into public.movie_ratings(user_id,slug,name,poster,source,score,review,status)
     values($1,$2,$3,$4,$5,$6,$7,'visible')
     on conflict (user_id,slug) do update set name=excluded.name,poster=excluded.poster,
       source=excluded.source,score=excluded.score,review=excluded.review,updated_at=now()
     where movie_ratings.updated_at <= now() - interval '60 seconds'
     returning score,review,status,updated_at`,
    [uid, slug, name, clean(body.poster, 1000), source, score, review || null],
  );
  if (!rows[0]) return bad("Vui lòng chờ 60 giây trước khi cập nhật", 429);
  return Response.json({ rating: rows[0] });
}

async function handler(request: Request) {
  try {
    await ensureSchema();
    return request.method === "GET" ? await list(request) : await save(request);
  } catch (error) {
    console.error("[ratings]", error);
    return bad("Server error", 500);
  }
}

export const Route = createFileRoute("/api/ratings")({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
});
