import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, Film, UserRound } from "lucide-react";
import { fetchDetail, fetchLatest } from "@/lib/api";
import type { MovieCard, SourceId } from "@/lib/types";
import { MovieCard as MovieCardView } from "@/components/MovieCard";
import { fetchPersonMetadata } from "@/lib/personMetadata";

const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
});

export const Route = createFileRoute("/actor/$name")({
  validateSearch: searchSchema,
  component: ActorProfile,
});

const normalized = (value: string) => value.trim().toLocaleLowerCase("vi-VN");

async function moviesByActor(name: string, source: SourceId): Promise<MovieCard[]> {
  const pages = await Promise.all([1, 2, 3].map((page) => fetchLatest(source, page)));
  const candidates = pages
    .flat()
    .filter((movie, index, list) => list.findIndex((item) => item.slug === movie.slug) === index);
  const details = await Promise.allSettled(
    candidates.map((movie) => fetchDetail(movie.slug, source)),
  );
  return details.flatMap((result) => {
    if (
      result.status !== "fulfilled" ||
      !result.value.actors?.some((actor) => normalized(actor) === normalized(name))
    )
      return [];
    const movie = result.value;
    return [
      {
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        poster: movie.poster,
        thumb: movie.thumb,
        year: movie.year,
        quality: movie.quality,
        lang: movie.lang,
        episode_current: movie.episode_current,
        source: movie.source,
      },
    ];
  });
}

function ActorProfile() {
  const { name } = Route.useParams();
  const { src } = Route.useSearch();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["actor", name, src],
    queryFn: () => moviesByActor(name, src as SourceId),
    staleTime: 30 * 60_000,
  });
  const { data: person } = useQuery({
    queryKey: ["person-metadata", name, "actor"],
    queryFn: () => fetchPersonMetadata(name, "actor"),
    staleTime: 24 * 60 * 60_000,
    retry: 1,
  });
  const featured = data[0];
  const timeline = [...data].sort(
    (left, right) => Number(right.year || 0) - Number(left.year || 0),
  );

  return (
    <main className="actor-profile min-h-[75vh]">
      <header className="actor-profile-hero relative isolate overflow-hidden border-b border-border">
        {featured?.thumb || featured?.poster ? (
          <img
            src={featured.thumb || featured.poster}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/25" />
        <div className="mx-auto flex min-h-[360px] max-w-[1400px] flex-col justify-between px-4 py-8 md:px-10">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
          <div className="max-w-3xl pb-4">
            {person?.image ? <img src={person.image} alt={person.name} className="h-24 w-24 rounded-full border border-primary/30 object-cover shadow-xl" /> : <span className="grid h-16 w-16 place-items-center rounded-full border border-primary/30 bg-primary/15 text-primary backdrop-blur"><UserRound className="h-8 w-8" /></span>}
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-primary">
              Hồ sơ diễn viên
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">{name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isLoading ? "Đang tổng hợp tác phẩm…" : `${data.length} tác phẩm tìm thấy từ ${src.toUpperCase()}`}
            </p>
            <nav aria-label="Mục hồ sơ diễn viên" className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {[["featured", "Phim nổi bật"], ["bio", "Tiểu sử"], ["roles", "Vai diễn"], ["related", "Phim liên quan"]].map(([id, label]) => (
                <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card/70 px-3 py-1.5 backdrop-blur hover:border-primary hover:text-primary">{label}</a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-12 px-4 py-10 md:px-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[2/3] rounded-lg bg-card shimmer" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Không tải được hồ sơ diễn viên.</p>
        ) : data.length ? (
          <>
            <section id="featured" className="scroll-mt-20">
              <h2 className="mb-4 text-xl font-black">Phim nổi bật</h2>
              <div className="scroll-row flex gap-4 overflow-x-auto pb-4">
                {data.slice(0, 10).map((movie, index) => <MovieCardView key={`${movie.source}-${movie.slug}`} movie={movie} index={index} />)}
              </div>
            </section>
            <section id="bio" className="scroll-mt-20 rounded-xl border border-border bg-card/55 p-5">
              <h2 className="text-xl font-black">Tiểu sử</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{person?.description || `Nguồn dữ liệu chưa cung cấp tiểu sử xác thực cho ${name}.`}</p>
              {person?.birthDate && <p className="mt-2 text-xs text-muted-foreground">Ngày sinh: {person.birthDate}</p>}
              {person && <a href={person.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">Nguồn: Wikidata</a>}
            </section>
            <section id="roles" className="scroll-mt-20">
              <h2 className="text-xl font-black">Vai diễn & timeline</h2>
              <div className="mt-5 border-l border-primary/35 pl-5">
                {timeline.map((movie) => (
                  <Link key={`${movie.source}-${movie.slug}`} to="/movie/$slug" params={{ slug: movie.slug }} search={{ src: movie.source }} className="relative mb-5 grid gap-1 rounded-lg border border-border bg-card/55 p-4 transition hover:border-primary md:grid-cols-[5rem_1fr]">
                    <span className="absolute -left-[1.55rem] top-5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <strong className="text-primary">{movie.year || "Chưa rõ"}</strong>
                    <span><b>{movie.name}</b><small className="mt-1 block text-muted-foreground">Tên vai diễn chưa được nguồn cung cấp</small></span>
                  </Link>
                ))}
              </div>
            </section>
            <section id="related" className="scroll-mt-20">
              <h2 className="mb-4 text-xl font-black">Phim liên quan</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {data.map((movie, index) => <MovieCardView key={`${movie.source}-${movie.slug}`} movie={movie} index={index} />)}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">Chưa tìm thấy phim của diễn viên này trong các phim cập nhật gần đây.</div>
        )}
      </div>
    </main>
  );
}
