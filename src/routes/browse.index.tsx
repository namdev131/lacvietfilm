import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Globe2, CalendarDays, Tag } from "lucide-react";
import { fetchCountries, fetchGenres, yearOptions } from "@/lib/browse";

export const Route = createFileRoute("/browse/")({
  head: () => ({
    meta: [
      { title: "Khám phá phim theo thể loại, quốc gia, năm | Lạc Việt Cinema" },
      {
        name: "description",
        content: "Duyệt kho phim theo thể loại, quốc gia và năm sản xuất, kèm bộ lọc và sắp xếp linh hoạt.",
      },
      { property: "og:title", content: "Khám phá phim — Lạc Việt Cinema" },
      { property: "og:description", content: "Thể loại, quốc gia, năm sản xuất — lọc và sắp xếp theo ý bạn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lacvietcinema.lovable.app/browse" },
    ],
    links: [{ rel: "canonical", href: "https://lacvietcinema.lovable.app/browse" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Khám phá phim theo thể loại, quốc gia và năm",
          url: "https://lacvietcinema.lovable.app/browse",
          isPartOf: { "@type": "WebSite", name: "Lạc Việt Cinema", url: "https://lacvietcinema.lovable.app/" },
        }),
      },
    ],
  }),
  component: BrowseIndex,
});

function BrowseIndex() {
  const genres = useQuery({ queryKey: ["genres"], queryFn: fetchGenres, staleTime: 6e5 });
  const countries = useQuery({ queryKey: ["countries"], queryFn: fetchCountries, staleTime: 6e5 });
  const years = yearOptions();

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-10 md:px-10">
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
        <Compass className="h-7 w-7 text-primary" /> Khám phá
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chọn thể loại, quốc gia hoặc năm sản xuất để lọc kho phim.
      </p>

      <Group icon={<Tag className="h-4 w-4 text-primary" />} title="Thể loại" loading={genres.isLoading}>
        {(genres.data ?? []).map((g) => (
          <Chip key={g.slug} type="the-loai" value={g.slug} label={g.name} />
        ))}
      </Group>

      <Group icon={<Globe2 className="h-4 w-4 text-primary" />} title="Quốc gia" loading={countries.isLoading}>
        {(countries.data ?? []).map((c) => (
          <Chip key={c.slug} type="quoc-gia" value={c.slug} label={c.name} />
        ))}
      </Group>

      <Group icon={<CalendarDays className="h-4 w-4 text-primary" />} title="Năm sản xuất">
        {years.map((y) => (
          <Chip key={y.slug} type="nam" value={y.slug} label={y.name} />
        ))}
      </Group>
    </div>
  );
}

function Group({
  icon,
  title,
  loading,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon} {title}
      </h2>
      {loading ? (
        <div className="mt-3 h-10 rounded bg-card shimmer" />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      )}
    </section>
  );
}

function Chip({ type, value, label }: { type: string; value: string; label: string }) {
  return (
    <Link
      to="/browse/$type/$value"
      params={{ type, value }}
      search={{ page: 1, sort: "modified.time" as const, year: undefined }}
      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
    >
      {label}
    </Link>
  );
}
