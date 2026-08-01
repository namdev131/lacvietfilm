import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import { searchMoviesMerged } from "@/lib/api";
import { Highlight } from "@/components/Highlight";
import type { SourceFilter } from "@/lib/types";

export const QUICK_SEARCH_EVENT = "lvc:open-quick-search";

export function openQuickSearch() {
  window.dispatchEvent(new Event(QUICK_SEARCH_EVENT));
}

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const SOURCES: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "kkphim", label: "KKPhim" },
  { id: "ophim", label: "OPhim" },
  { id: "nguonc", label: "NguonC" },
  { id: "vsmov", label: "VSMov" },
];

/**
 * Bảng tìm kiếm nổi: mở đè lên trang hiện tại (kể cả khi đang xem phim)
 * nên video phía sau vẫn phát liên tục, không bị gián đoạn.
 */
export function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(QUICK_SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(QUICK_SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const term = useDebounced(q.replace(/\s+/g, " ").trim(), 350);
  const enabled = term.length >= 2;
  const { data, isFetching } = useQuery({
    queryKey: ["quick-search", source, term],
    queryFn: () => searchMoviesMerged(term, source),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const results = useMemo(() => (data || []).slice(0, 24), [data]);
  const watching = pathname.startsWith("/watch");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        aria-label="Đóng tìm kiếm"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/50"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm phim khác trong lúc đang xem…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                source === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!enabled && (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Nhập ít nhất 2 ký tự để tìm. {watching ? "Phim vẫn đang phát phía sau." : ""}
            </p>
          )}
          {enabled && results.length === 0 && !isFetching && (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Không tìm thấy phim phù hợp.
            </p>
          )}
          <ul className="space-y-1">
            {results.map((m) => (
              <li key={`${m.source}-${m.slug}`}>
                <Link
                  to="/movie/$slug"
                  params={{ slug: m.slug }}
                  search={{ src: m.source }}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 rounded-lg p-2 transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <div className="h-[72px] w-[48px] shrink-0 overflow-hidden rounded bg-muted">
                    {m.poster && (
                      <img src={m.poster} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">
                      <Highlight text={m.name} query={term} />
                    </div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      <Highlight text={m.origin_name || ""} query={term} />
                      {m.year ? ` · ${m.year}` : ""}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {m.source}
                      {m.episode_current ? ` · ${m.episode_current}` : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
