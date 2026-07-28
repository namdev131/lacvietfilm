import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchMoviesMerged } from "@/lib/api";
import { MovieCard } from "@/components/MovieCard";
import { SourcePing } from "@/components/SourcePing";
import type { SourceFilter } from "@/lib/types";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [committed, setCommitted] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const { data, isFetching } = useQuery({
    queryKey: ["search", source, committed],
    queryFn: () => searchMoviesMerged(committed, source),
    enabled: committed.length > 0,
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl md:text-3xl font-black tracking-tight">Tìm phim</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); setCommitted(q.trim()); }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tên phim, diễn viên, hoặc từ khóa…"
            className="w-full rounded-full border border-border bg-card px-10 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Tìm
        </button>
      </form>
      <div className="mt-4">
        <SourcePing value={source} onChange={setSource} />
      </div>
      <div className="mt-8">
        {isFetching && <p className="text-sm text-muted-foreground">Đang tìm…</p>}
        {!isFetching && committed && !data?.length && (
          <p className="text-sm text-muted-foreground">Không có kết quả cho "{committed}".</p>
        )}
        {data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.map((m, i) => <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
