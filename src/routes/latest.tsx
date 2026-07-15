import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchLatest } from "@/lib/api";
import { MovieCard } from "@/components/MovieCard";
import { SourcePing } from "@/components/SourcePing";
import type { SourceId } from "@/lib/types";

export const Route = createFileRoute("/latest")({
  component: LatestPage,
});

function LatestPage() {
  const [source, setSource] = useState<SourceId>("kkphim");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["latest", source, page],
    queryFn: () => fetchLatest(source, page),
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
          {(data || []).map((m, i) => <MovieCard key={m.slug} movie={m} index={i} />)}
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
