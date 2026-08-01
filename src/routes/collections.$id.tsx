import { createFileRoute, Link } from "@tanstack/react-router";
import { useCollection } from "@/hooks/useCollections";
import { CollectionView } from "@/components/CollectionView";

export const Route = createFileRoute("/collections/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết bộ sưu tập | Lạc Việt Cinema" },
      { name: "description", content: "Danh sách phim trong bộ sưu tập tự tạo của bạn." },
      { property: "og:title", content: "Bộ sưu tập phim — Lạc Việt Cinema" },
      { property: "og:description", content: "Playlist phim tự tạo tại Lạc Việt Cinema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionDetail,
});

function CollectionDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useCollection(id, "id");

  if (isLoading) {
    return <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-10"><div className="h-40 rounded-xl bg-card shimmer" /></div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Không tìm thấy bộ sưu tập</h1>
        <Link to="/collections" className="mt-4 inline-block text-primary">Về danh sách bộ sưu tập</Link>
      </div>
    );
  }
  return <CollectionView collection={data.collection} items={data.items} />;
}
