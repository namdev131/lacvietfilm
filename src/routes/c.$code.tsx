import { createFileRoute, Link } from "@tanstack/react-router";
import { useCollection } from "@/hooks/useCollections";
import { CollectionView } from "@/components/CollectionView";

export const Route = createFileRoute("/c/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Bộ sưu tập được chia sẻ | Lạc Việt Cinema" },
      { name: "description", content: "Xem bộ sưu tập phim được chia sẻ công khai trên Lạc Việt Cinema." },
      { property: "og:title", content: "Bộ sưu tập được chia sẻ — Lạc Việt Cinema" },
      { property: "og:description", content: "Playlist phim công khai từ cộng đồng Lạc Việt Cinema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `https://lacvietcinema.lovable.app/c/${params.code}` },
    ],
    links: [{ rel: "canonical", href: `https://lacvietcinema.lovable.app/c/${params.code}` }],
  }),
  component: SharedCollection,
});

function SharedCollection() {
  const { code } = Route.useParams();
  const { data, isLoading } = useCollection(code, "share_code");

  if (isLoading) {
    return <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-10"><div className="h-40 rounded-xl bg-card shimmer" /></div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Bộ sưu tập không tồn tại hoặc chưa được công khai</h1>
        <Link to="/" className="mt-4 inline-block text-primary">Về trang nhà</Link>
      </div>
    );
  }
  return <CollectionView collection={data.collection} items={data.items} />;
}
