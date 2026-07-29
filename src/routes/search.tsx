import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import { searchMoviesMerged } from "@/lib/api";
import { MovieCard } from "@/components/MovieCard";
import { SourcePing } from "@/components/SourcePing";
import type { SourceFilter } from "@/lib/types";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Tìm phim đa nguồn · Lạc Việt Cinema" },
      {
        name: "description",
        content:
          "Tìm phim realtime trên nhiều nguồn cùng lúc, kết quả gợi ý ngay khi bạn gõ tại Lạc Việt Cinema.",
      },
      { property: "og:title", content: "Tìm phim đa nguồn · Lạc Việt Cinema" },
      {
        property: "og:description",
        content: "Gõ tới đâu, kết quả hiện tới đó — tìm phim nhanh trên nhiều nguồn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const term = useDebounced(q.replace(/\s+/g, " ").trim(), 350);
  const enabled = term.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["search", source, term],
    queryFn: () => searchMoviesMerged(term, source),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl md:text-3xl font-black tracking-tight">Tìm phim</h1>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tên phim, diễn viên, hoặc từ khóa…"
            className="w-full rounded-full border border-border bg-card px-10 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {isFetching && enabled && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {q && (
              <button
                type="button"
                aria-label="Xoá từ khoá"
                onClick={() => setQ("")}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </form>
      <div className="mt-4">
        <SourcePing value={source} onChange={setSource} />
      </div>
      <div className="mt-8">
        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Nhập ít nhất 2 ký tự — kết quả hiện ngay khi bạn gõ.
          </p>
        )}
        {enabled && !isFetching && !data?.length && (
          <p className="text-sm text-muted-foreground">Không có kết quả cho "{term}".</p>
        )}
        {enabled && data && data.length > 0 && (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              {data.length} kết quả cho "{term}"
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {data.map((m, i) => (
                <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
