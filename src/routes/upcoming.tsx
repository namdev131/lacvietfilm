import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { fetchUpcoming } from "@/lib/browse";

export const Route = createFileRoute("/upcoming")({
  head: () => ({
    meta: [
      { title: "Phim sắp chiếu mới nhất | Lạc Việt Film" },
      {
        name: "description",
        content: "Danh sách phim sắp chiếu được cập nhật liên tục — đón đầu những bộ phim đáng chờ đợi nhất.",
      },
      { property: "og:title", content: "Phim sắp chiếu — Lạc Việt Film" },
      { property: "og:description", content: "Đón đầu những bộ phim sắp ra mắt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["upcoming", page],
    queryFn: () => fetchUpcoming(page),
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-32 pt-10 md:px-10">
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
        <CalendarClock className="h-7 w-7 text-primary" /> Sắp chiếu
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Những bộ phim sắp lên sóng — lưu vào Xem sau để không bỏ lỡ.</p>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded bg-card shimmer" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Chưa có phim sắp chiếu nào.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data!.map((m, i) => (
            <MovieCard key={`${m.source}-${m.slug}`} movie={m} index={i} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm disabled:opacity-40"
        >
          Trang trước
        </button>
        <span className="text-sm text-muted-foreground">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:border-primary"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
