import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, Clapperboard } from "lucide-react";
import { fetchDetail, fetchLatest } from "@/lib/api";
import type { MovieCard, SourceId } from "@/lib/types";
import { MovieCard as MovieCardView } from "@/components/MovieCard";
import { fetchPersonMetadata } from "@/lib/personMetadata";

const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc", "vsmov", "rapchieuphim", "aiphim", "thuongkhung3d", "animapper"]).default("kkphim"),
});

export const Route = createFileRoute("/director/$name")({
  validateSearch: searchSchema,
  component: DirectorProfile,
});

const normalized = (value: string) => value.trim().toLocaleLowerCase("vi-VN");

async function moviesByDirector(name: string, source: SourceId): Promise<MovieCard[]> {
  const pages = await Promise.all([1, 2, 3].map((page) => fetchLatest(source, page)));
  const candidates = pages.flat().filter((movie, index, list) => list.findIndex((item) => item.slug === movie.slug) === index);
  const details = await Promise.allSettled(candidates.map((movie) => fetchDetail(movie.slug, source)));
  return details.flatMap((result) => {
    if (result.status !== "fulfilled" || !result.value.director?.some((director) => normalized(director) === normalized(name))) return [];
    const movie = result.value;
    return [{ slug: movie.slug, name: movie.name, origin_name: movie.origin_name, poster: movie.poster, thumb: movie.thumb, year: movie.year, quality: movie.quality, lang: movie.lang, episode_current: movie.episode_current, source: movie.source }];
  });
}

function DirectorProfile() {
  const { name } = Route.useParams();
  const { src } = Route.useSearch();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["director", name, src],
    queryFn: () => moviesByDirector(name, src as SourceId),
    staleTime: 30 * 60_000,
  });
  const { data: person } = useQuery({
    queryKey: ["person-metadata", name, "director"],
    queryFn: () => fetchPersonMetadata(name, "director"),
    staleTime: 24 * 60 * 60_000,
    retry: 1,
  });

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1400px] px-4 py-8 md:px-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Trang chủ</Link>
      <header className="mt-6 flex items-center gap-4 border-b border-border pb-6">
        {person?.image ? <img src={person.image} alt={person.name} className="h-20 w-20 rounded-full border border-primary/30 object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary"><Clapperboard className="h-7 w-7" /></span>}
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Hồ sơ đạo diễn</p><h1 className="mt-1 text-2xl font-black md:text-4xl">{name}</h1><p className="mt-1 text-sm text-muted-foreground">{person?.description || `Phim tìm thấy từ ${src.toUpperCase()}`}</p>{person?.birthDate && <p className="mt-1 text-xs text-muted-foreground">Ngày sinh: {person.birthDate}</p>}{person && <a href={person.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Nguồn: Wikidata</a>}</div>
      </header>
      {isLoading ? <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[2/3] rounded-lg bg-card shimmer" />)}</div> : error ? <p className="mt-10 text-sm text-destructive">Không tải được phim của đạo diễn này.</p> : data.length ? <section className="mt-8"><h2 className="mb-4 text-lg font-bold">Các phim đã đạo diễn ({data.length})</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{data.map((movie) => <MovieCardView key={`${movie.source}-${movie.slug}`} movie={movie} />)}</div></section> : <div className="mt-10 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">Chưa tìm thấy phim khác của đạo diễn này trong các phim cập nhật gần đây.</div>}
    </main>
  );
}
