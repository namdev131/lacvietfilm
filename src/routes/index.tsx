import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Play, Info } from "lucide-react";
import { fetchLatest, fetchLatestMerged } from "@/lib/api";
import { MovieRow } from "@/components/MovieRow";
import { GoldBoard } from "@/components/GoldBoard";
import { SourcePing } from "@/components/SourcePing";
import { useSettings } from "@/lib/settings";
import type { SourceFilter } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lạc Việt Film — Xem phim Vietsub & Thuyết minh miễn phí" },
      { name: "description", content: "Xem phim online chất lượng cao: phim mới, bảng vàng realtime, HLS & Embed, nhiều nguồn phát để đổi khi giật lag." },
      { property: "og:title", content: "Lạc Việt Film — Mở phim, chạm hồn Việt" },
      { property: "og:description", content: "Phim mới mỗi ngày, bảng vàng realtime, xem Vietsub và Thuyết minh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { settings } = useSettings();
  const [source, setSource] = useState<SourceFilter>("all");
  // Áp dụng nguồn mặc định trong Cài đặt (sau khi hydrate)
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (appliedDefault.current) return;
    appliedDefault.current = true;
    setSource(settings.defaultSource as SourceFilter);
  }, [settings.defaultSource]);
  const kk = useQuery({ queryKey: ["latest", "kkphim", 1], queryFn: () => fetchLatest("kkphim", 1) });
  const op = useQuery({ queryKey: ["latest", "ophim", 1], queryFn: () => fetchLatest("ophim", 1) });
  const ng = useQuery({ queryKey: ["latest", "nguonc", 1], queryFn: () => fetchLatest("nguonc", 1) });
  const vs = useQuery({ queryKey: ["latest", "vsmov", 1], queryFn: () => fetchLatest("vsmov", 1) });
  const kk2 = useQuery({ queryKey: ["latest", "kkphim", 2], queryFn: () => fetchLatest("kkphim", 2) });
  const all = useQuery({ queryKey: ["latest", "all", 1], queryFn: () => fetchLatestMerged("all", 1) });

  const featured =
    (source === "all"
      ? all.data
      : source === "kkphim"
        ? kk.data
        : source === "ophim"
          ? op.data
          : source === "vsmov"
            ? vs.data
            : ng.data) || [];
  const hero = featured[0];

  const vietsub = (kk.data || []).filter((m) => (m.lang || "").toLowerCase().includes("vietsub"));
  const thuyetminh = (kk.data || []).filter((m) => (m.lang || "").toLowerCase().includes("thuyết"));


  return (
    <div className="heritage-home">
      {/* Hero */}
      <section className="heritage-hero cinema-hero relative min-h-[min(76dvh,720px)] w-full overflow-hidden">
        {hero?.thumb || hero?.poster ? (
          <motion.img
            key={hero.slug}
            src={hero.thumb || hero.poster}
            alt={hero.name}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="cinema-hero-image absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 hero-fade" />
        <div className="absolute inset-0 hero-side-fade" />
        <div className="cinema-hero-copy relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-10 md:px-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl space-y-4"
          >
            <div className="hero-kicker inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              Đề cử Lạc Việt
            </div>
            <h1 className="text-balance text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {hero?.name || "Lạc Việt Film"}
            </h1>
            {hero?.origin_name && (
              <p className="text-sm text-muted-foreground md:text-base">
                {hero.origin_name} {hero.year ? `· ${hero.year}` : ""} {hero.quality ? `· ${hero.quality}` : ""}
              </p>
            )}
            <p className="max-w-xl text-sm text-white/80 md:text-base">
              Mở phim, chạm hồn Việt.
            </p>
            {hero && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  to="/watch/$slug"
                  params={{ slug: hero.slug }}
                  search={{ src: hero.source, ep: 0, srv: 0 }}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 fill-current" /> Phát phim
                </Link>
                <Link
                  to="/movie/$slug"
                  params={{ slug: hero.slug }}
                  search={{ src: hero.source }}
                  className="inline-flex items-center gap-2 rounded-md bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
                >
                  <Info className="h-4 w-4" /> Chi tiết
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Source ping bar */}
      <div className="heritage-source-bar mx-auto max-w-[1600px] px-4 pt-5 md:px-10">
        <div className="heritage-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <SourcePing value={source} onChange={setSource} />
          <div className="text-[11px] text-muted-foreground">
            Ping cập nhật mỗi 30s · Bấm để đổi nguồn phim mới
          </div>
        </div>
      </div>

      <div className="home-content-rail mt-8 space-y-8 md:space-y-12">
        <MovieRow
          title="Phim mới"
          movies={featured}
          accent="cuộn ngang"
        />
        <GoldBoard />
        <MovieRow title="Vietsub nổi bật" movies={vietsub.slice(0, 20)} />
        <MovieRow title="Thuyết Minh" movies={thuyetminh.slice(0, 20)} />
        <MovieRow title="Kho phim OPhim" movies={op.data || []} />
        <MovieRow title="Kho phim NguonC" movies={ng.data || []} />
        <MovieRow title="Kho phim VSMov" movies={vs.data || []} />
        <MovieRow title="Đề xuất thêm" movies={kk2.data || []} />

      </div>
    </div>
  );
}
