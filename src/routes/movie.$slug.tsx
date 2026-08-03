import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Play, ArrowLeft } from "lucide-react";
import { fetchDetail } from "@/lib/api";
import type { SourceId } from "@/lib/types";
import DOMPurify from "isomorphic-dompurify";
import { FavoriteButton } from "@/components/FavoriteButton";
import { WatchLaterButton } from "@/components/WatchLaterButton";
import { FollowButton } from "@/components/FollowButton";
import { RatingStars } from "@/components/RatingStars";
import { CommentsSection } from "@/components/CommentsSection";
import { AddToCollectionButton } from "@/components/AddToCollectionButton";

const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
});

export const Route = createFileRoute("/movie/$slug")({
  validateSearch: searchSchema,
  component: MoviePage,
});

function MoviePage() {
  const { slug } = Route.useParams();
  const { src } = Route.useSearch();
  const source = src as SourceId;
  const { data, isLoading, error } = useQuery({
    queryKey: ["detail", source, slug],
    queryFn: () => fetchDetail(slug, source),
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 md:px-10"><div className="h-64 rounded-lg bg-card shimmer" /></div>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Không tải được thông tin phim</h2>
        <Link to="/" className="mt-4 inline-block text-primary">Về trang nhà</Link>
      </div>
    );
  }

  const totalEps = data.servers[0]?.items.length || 0;
  const sanitized = DOMPurify.sanitize(data.content || "");

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        {data.thumb && <img src={data.thumb} alt="" className="h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Trang nhà
        </Link>

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr] lg:gap-10">
          <div>
            <div className="aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-border/60">
              {data.poster && <img src={data.poster} alt={data.name} className="h-full w-full object-cover" />}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{data.name}</h1>
              {data.origin_name && <p className="text-sm text-muted-foreground">{data.origin_name}</p>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {data.quality && <Badge>{data.quality}</Badge>}
              {data.lang && <Badge>{data.lang}</Badge>}
              {data.year && <Badge>{data.year}</Badge>}
              {data.time && <Badge>{data.time}</Badge>}
              {data.episode_current && <Badge>{data.episode_current}</Badge>}
              <Badge className="bg-primary/15 text-primary">Nguồn: {source.toUpperCase()}</Badge>
            </div>
            {data.category && data.category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {data.category.map((c) => (
                  <span key={c} className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{c}</span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {totalEps > 0 && (
                <Link
                  to="/watch/$slug"
                  params={{ slug: data.slug }}
                  search={{ src: source, ep: 0, srv: 0 }}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 fill-current" /> Phát phim
                </Link>
              )}
              <FavoriteButton slug={data.slug} name={data.name} poster={data.poster} source={source} />
              <WatchLaterButton slug={data.slug} name={data.name} poster={data.poster} source={source} />
              <FollowButton slug={data.slug} name={data.name} poster={data.poster} source={source} episodes={totalEps} />
              <AddToCollectionButton slug={data.slug} name={data.name} poster={data.poster} source={source} />
            </div>
            <RatingStars slug={data.slug} name={data.name} poster={data.poster} source={source} />
            {sanitized && (
              <div
                className="prose prose-invert prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitized }}
              />
            )}
            <div className="grid gap-2 pt-2 text-sm md:grid-cols-2">
              {data.director?.length ? (
                <div><span className="text-muted-foreground">Đạo diễn:</span> {data.director.join(", ")}</div>
              ) : null}
              {data.actors?.length ? (
                <div><span className="text-muted-foreground">Diễn viên:</span> {data.actors.slice(0, 8).join(", ")}</div>
              ) : null}
              {data.country?.length ? (
                <div><span className="text-muted-foreground">Quốc gia:</span> {data.country.join(", ")}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Server list preview */}
        {data.servers.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold">Danh sách máy chủ</h2>
            <div className="flex flex-wrap gap-2">
              {data.servers.map((s, i) => (
                <Link
                  key={i}
                  to="/watch/$slug"
                  params={{ slug: data.slug }}
                  search={{ src: source, ep: 0, srv: i }}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                >
                  {s.server_name} · {s.items.length} tập
                </Link>
              ))}
            </div>
          </div>
        )}

        <CommentsSection slug={data.slug} source={source} />
      </div>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-md bg-muted px-2 py-1 font-medium ${className}`}>{children}</span>
  );
}
