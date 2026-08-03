import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchLatestMerged } from "@/lib/api";
import { MovieCard } from "@/components/MovieCard";
import { SourcePing } from "@/components/SourcePing";
import type { SourceFilter } from "@/lib/types";

export const Route = createFileRoute("/latest")({
  head: () => ({
    meta: [
      { title: "Phim mới cập nhật hôm nay | Lạc Việt Cinema" },
      {
        name: "description",
        content:
          "Danh sách phim mới cập nhật mỗi ngày từ nhiều nguồn: phim lẻ, phim bộ, vietsub và thuyết minh, xem trực tuyến miễn phí tại Lạc Việt Cinema.",
      },
      { property: "og:title", content: "Phim mới cập nhật hôm nay — Lạc Việt Cinema" },
      {
        property: "og:description",
        content: "Cập nhật phim mới liên tục từ nhiều nguồn, vietsub và thuyết minh, xem ngay không cần đăng ký.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lacvietcinema.lovable.app/latest" },
    ],
    links: [{ rel: "canonical", href: "https://lacvietcinema.lovable.app/latest" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Phim mới cập nhật",
          description: "Danh sách phim mới cập nhật mỗi ngày tại Lạc Việt Cinema.",
          url: "https://lacvietcinema.lovable.app/latest",
          isPartOf: { "@type": "WebSite", name: "Lạc Việt Cinema", url: "https://lacvietcinema.lovable.app/" },
        }),
      },
    ],
  }),
  component: LatestPage,
});


function LatestPage() {
  const [source, setSource] = useState<SourceFilter>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["latest", source, page],
    queryFn: () => fetchLatestMerged(source, page),
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Phim mới cập nhật</h1>
        <SourcePing value={source} onChange={(s) => { setSource(s); setPage(1); }} />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded bg-card shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(data || []).map((m, i) => <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} />)}
        </div>
      )}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm disabled:opacity-40"
        >Trang trước</button>
        <span className="text-sm text-muted-foreground">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:border-primary"
        >Trang sau</button>
      </div>
    </div>
  );
}
