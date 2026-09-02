import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, Loader2, X, Clock, TrendingUp, Trash2 } from "lucide-react";
import { SEARCH_SOURCES, searchMoviesMerged } from "@/lib/api";
import { MovieCard } from "@/components/MovieCard";
import { SourcePing } from "@/components/SourcePing";
import { Highlight } from "@/components/Highlight";
import {
  getSearchHistory,
  pushSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  matchHistory,
  type SearchHistoryItem,
} from "@/lib/searchHistory";
import type { SourceFilter } from "@/lib/types";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Tìm phim đa nguồn · Lạc Việt Film" },
      {
        name: "description",
        content:
          "Tìm phim realtime trên nhiều nguồn cùng lúc, kết quả gợi ý ngay khi bạn gõ tại Lạc Việt Film.",
      },
      { property: "og:title", content: "Tìm phim đa nguồn · Lạc Việt Film" },
      {
        property: "og:description",
        content: "Gõ tới đâu, kết quả hiện tới đó — tìm phim nhanh trên nhiều nguồn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TRENDING = ["Thám tử", "Hành động", "Anime", "Hàn Quốc", "Cổ trang", "Kinh dị"];

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
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = useDebounced(q.replace(/\s+/g, " ").trim(), 350);
  const enabled = term.length >= 2;

  useEffect(() => setHistory(getSearchHistory()), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", source, term],
    queryFn: () => searchMoviesMerged(term, source),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // Lưu lịch sử khi có kết quả thật (kèm số kết quả)
  useEffect(() => {
    if (enabled && data && data.length > 0) setHistory(pushSearchHistory(term, data.length));
  }, [enabled, term, data?.length]);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of data || []) {
      const n = m.name?.trim();
      if (!n || seen.has(n.toLowerCase())) continue;
      seen.add(n.toLowerCase());
      out.push(n);
      if (out.length >= 8) break;
    }
    return out;
  }, [data]);

  // Lịch sử gợi ý theo từ đang gõ, sắp theo tần suất
  const historyView = useMemo(
    () => matchHistory(q.trim(), 8),
    [q, history],
  );

  const submit = (value: string) => {
    setQ(value);
    setOpen(false);
    setHistory(pushSearchHistory(value));
  };


  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-10">
      <h1 className="mb-6 text-2xl md:text-3xl font-black tracking-tight">Tìm phim</h1>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
        <div ref={boxRef} className="relative flex-1 min-w-[240px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit(q)}
            placeholder="Tên phim, diễn viên, hoặc từ khóa…"
            className="w-full rounded-full border border-border bg-card px-10 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {isFetching && enabled && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
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

          {/* Gợi ý + lịch sử */}
          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur">
              {enabled && suggestions.length > 0 && (
                <div className="py-1.5">
                  <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Gợi ý
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
                    >
                      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="line-clamp-1">
                        <Highlight text={s} query={term} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {historyView.length > 0 && (
                <div className="border-t border-border/60 py-1.5">
                  <div className="flex items-center justify-between px-4 py-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Lịch sử tìm kiếm
                    </p>
                    <button
                      type="button"
                      onClick={() => setHistory(clearSearchHistory())}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" /> Xoá hết
                    </button>
                  </div>
                  {historyView.map((h) => (
                    <div key={h.q} className="group flex items-center hover:bg-muted">
                      <button
                        type="button"
                        onClick={() => submit(h.q)}
                        className="flex flex-1 items-center gap-2 px-4 py-2 text-left text-sm"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1 flex-1">
                          <Highlight text={h.q} query={q.trim()} tone="subtle" />
                        </span>
                        {typeof h.hits === "number" && (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {h.hits} kq
                          </span>
                        )}
                        {h.count > 1 && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                            ×{h.count}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={`Xoá ${h.q}`}
                        onClick={() => setHistory(removeSearchHistory(h.q))}
                        className="px-3 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}


              {!enabled && (
                <div className="border-t border-border/60 px-4 py-3">
                  <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> Từ khoá phổ biến
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TRENDING.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => submit(t)}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary/60"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Bộ lọc nguồn */}
      <div className="mt-4">
        <SourcePing value={source} onChange={setSource} sources={SEARCH_SOURCES} />
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
                <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} highlight={term} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
