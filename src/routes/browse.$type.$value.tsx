import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { fetchBrowse, yearOptions, SORT_FIELDS, type BrowseType, type SortField } from "@/lib/browse";

const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  sort: z.enum(["modified.time", "_id", "year"]).default("modified.time"),
  year: z.string().optional(),
});

const TYPE_LABEL: Record<string, string> = {
  "the-loai": "Thể loại",
  "quoc-gia": "Quốc gia",
  nam: "Năm",
};

export const Route = createFileRoute("/browse/$type/$value")({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const label = `${TYPE_LABEL[params.type] ?? "Phim"}: ${params.value.replace(/-/g, " ")}`;
    return {
      meta: [
        { title: `${label} | Lạc Việt Film` },
        { name: "description", content: `Danh sách phim theo ${label.toLowerCase()} — lọc theo năm và sắp xếp linh hoạt.` },
        { property: "og:title", content: `${label} — Lạc Việt Film` },
        { property: "og:description", content: `Xem phim theo ${label.toLowerCase()} tại Lạc Việt Film.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BrowseListPage,
});

function BrowseListPage() {
  const { type, value } = Route.useParams();
  const { page, sort, year } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["browse", type, value, page, sort, year],
    queryFn: () => fetchBrowse({ type: type as BrowseType, value, page, sort: sort as SortField, year }),
  });

  const setSearch = (patch: Partial<{ page: number; sort: SortField; year?: string }>) =>
    navigate({ search: { page, sort, year, ...patch } });

  const heading = data?.title || `${TYPE_LABEL[type] ?? ""} ${value.replace(/-/g, " ")}`;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-32 pt-8 md:px-10">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Khám phá
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-black capitalize tracking-tight md:text-3xl">{heading}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSearch({ sort: e.target.value as SortField, page: 1 })}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {SORT_FIELDS.map((s) => (
              <option key={s.id} value={s.id}>
                Sắp xếp: {s.label}
              </option>
            ))}
          </select>
          {type !== "nam" && (
            <select
              value={year ?? ""}
              onChange={(e) => setSearch({ year: e.target.value || undefined, page: 1 })}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Mọi năm</option>
              {yearOptions().map((y) => (
                <option key={y.slug} value={y.slug}>
                  {y.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded bg-card shimmer" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Không có phim phù hợp với bộ lọc này.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data!.items.map((m, i) => (
            <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setSearch({ page: Math.max(1, page - 1) })}
          disabled={page <= 1}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm disabled:opacity-40"
        >
          Trang trước
        </button>
        <span className="text-sm text-muted-foreground">
          Trang {page}
          {data?.totalPages ? ` / ${data.totalPages}` : ""}
        </span>
        <button
          onClick={() => setSearch({ page: page + 1 })}
          disabled={!!data?.totalPages && page >= data.totalPages}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
