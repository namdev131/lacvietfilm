import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { recordHistory } from "@/hooks/useUserData";
import { recordView, detectKind } from "@/lib/gold";
import { ArrowLeft, Languages, Mic, Zap, Film } from "lucide-react";
import { fetchDetail, fetchLatestMerged } from "@/lib/api";
import { type PlayMode } from "@/components/Player";
import { usePlayerHost, usePlayerDock } from "@/components/PlayerHost";
import { MovieRow } from "@/components/MovieRow";
import { SourcePing } from "@/components/SourcePing";
import type { SourceId } from "@/lib/types";

const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
  ep: z.number().int().min(0).default(0),
  srv: z.number().int().min(0).default(0),
});

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Xem phim — Lạc Việt Cinema" },
      { name: "description", content: "Xem phim trực tuyến trên Lạc Việt Cinema." },
      { property: "og:title", content: "Xem phim — Lạc Việt Cinema" },
      { property: "og:description", content: "Xem phim trực tuyến trên Lạc Việt Cinema." },
      { property: "og:type", content: "video.movie" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchPage,
});

function detectLang(name: string): "vietsub" | "thuyetminh" | "other" {
  const n = name.toLowerCase();
  if (n.includes("thuyết") || n.includes("thuyet") || n.includes("lồng") || n.includes("long tieng")) return "thuyetminh";
  if (n.includes("vietsub") || n.includes("vsub") || n.includes("phụ đề") || n.includes("sub")) return "vietsub";
  return "other";
}

function WatchPage() {
  const { slug } = Route.useParams();
  const { src, ep, srv } = Route.useSearch();
  const navigate = useNavigate();
  const source = src as SourceId;
  const { user } = useAuth();

  const hlsSources: SourceId[] = ["kkphim", "ophim", "vsmov"];
  const allowHls = hlsSources.includes(source);
  const [mode, setMode] = useState<PlayMode>(allowHls ? "hls" : "embed");

  useEffect(() => {
    setMode(allowHls ? "hls" : "embed");
  }, [allowHls]);
  const [groupStart, setGroupStart] = useState(0);
  const qc = useQueryClient();
  const host = usePlayerHost();
  const dockRef = usePlayerDock();

  // Tiến độ xem đã lưu của tập hiện tại
  const [saved, setSaved] = useState<{ position: number; duration: number } | null>(null);
  useEffect(() => {
    const read = () => {
      const p = getLocalProgress(source, slug, srv, ep);
      setSaved(p ? { position: p.position, duration: p.duration } : null);
    };
    read();
    const id = window.setInterval(read, 5000);
    return () => window.clearInterval(id);
  }, [source, slug, srv, ep]);
  const savedPct = saved ? progressPercent(saved.position, saved.duration) : 0;


  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["detail", source, slug],
    queryFn: () => fetchDetail(slug, source),
    retry: 1,
  });

  const servers = useMemo(
    () => (data?.servers || []).filter((server) => server.items.some((item) => item.m3u8 || item.embed)),
    [data],
  );
  const currentServer = servers[srv] || servers[0];
  const currentEp = currentServer?.items[ep];

  // Group servers by language
  const langGroups = useMemo(() => {
    if (!data) return { vietsub: [] as number[], thuyetminh: [] as number[], other: [] as number[] };
    const g: any = { vietsub: [], thuyetminh: [], other: [] };
    servers.forEach((s, i) => g[detectLang(s.server_name)].push(i));
    return g;
  }, [data, servers]);

  const eps = currentServer?.items || [];
  const groups: { start: number; end: number }[] = [];
  for (let i = 0; i < eps.length; i += 10) {
    groups.push({ start: i, end: Math.min(i + 9, eps.length - 1) });
  }
  const clampedGroupStart = Math.min(groupStart, Math.max(0, (groups.length - 1) * 10));
  const visibleEps = eps.slice(clampedGroupStart, clampedGroupStart + 10);

  // Ghi nhận lượt xem cho Bảng Vàng (kể cả khách chưa đăng nhập)
  useEffect(() => {
    if (!data) return;
    recordView({
      slug: data.slug,
      name: data.name,
      poster: data.poster,
      source,
      kind: detectKind(data),
      lang: detectLang(currentServer?.server_name || ""),
      userId: user?.id ?? null,
    });
  }, [data?.slug, source, user?.id]);

  useEffect(() => {
    if (!user || !data) return;
    recordHistory(user.id, {
      slug: data.slug,
      name: data.name,
      poster: data.poster,
      source,
      episode_slug: currentEp?.slug,
      episode_name: currentEp?.name,
      ep_index: ep,
      srv_index: srv,
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["history"] });
    });
  }, [user, data, source, ep, srv, currentEp?.slug, currentEp?.name]);


  // Đẩy phim hiện tại vào trình phát toàn cục (tiếp tục phát khi rời trang)
  useEffect(() => {
    if (!data || !currentEp) return;
    host.start({
      slug,
      source,
      name: data.name,
      epLabel: `${currentServer?.server_name ?? ""} · ${currentEp.name || `Tập ${ep + 1}`}`,
      ep,
      srv,
      m3u8: currentEp.m3u8,
      embed: currentEp.embed,
      poster: data.thumb || data.poster,
      allowHls,
      mode: allowHls ? mode : "embed",
    });
  }, [data?.slug, slug, source, ep, srv, currentEp?.m3u8, currentEp?.embed, mode, allowHls]);

  // Phim đề xuất
  const { data: suggested } = useQuery({
    queryKey: ["suggest", source, data?.slug],
    queryFn: () => fetchLatestMerged("all", 1),
    staleTime: 5 * 60_000,
    enabled: !!data,
  });
  const recommend = useMemo(() => {
    const cats = new Set((data?.category || []).map((c: any) => (typeof c === "string" ? c : c?.name)));
    const list = (suggested || []).filter((m) => m.slug !== slug);
    const scored = list.map((m) => ({
      m,
      s: (m.year && data?.year && m.year === data.year ? 1 : 0) + (cats.size ? 0 : 0),
    }));
    return scored.sort((a, b) => b.s - a.s).map((x) => x.m).slice(0, 24);
  }, [suggested, data?.slug, data?.year, slug]);

  const goEp = (i: number) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: i, srv } });
  const goSrv = (i: number) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: 0, srv: i } });
  const changeSource = (s: SourceId) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: s, ep: 0, srv: 0 } });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 md:px-10"><div className="aspect-video rounded-lg bg-card shimmer" /></div>;
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">Không tải được trang xem phim</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phim này có thể chưa tồn tại trên VSMov hoặc nguồn đang tạm gián đoạn.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Thử lại
          </button>
          <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm font-medium">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-10">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/movie/$slug" params={{ slug }} search={{ src: source }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Chi tiết phim
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div ref={dockRef} className="aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-border/60" />

          <div className="inline-flex overflow-hidden rounded-full border border-border bg-card">
            {allowHls && (
              <button
                disabled={!currentEp?.m3u8}
                onClick={() => setMode("hls")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                  mode === "hls" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> HLS (m3u8)
              </button>
            )}
            <button
              disabled={!currentEp?.embed}
              onClick={() => setMode("embed")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                mode === "embed" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <Film className="h-3.5 w-3.5" /> Embed
            </button>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentServer?.server_name} · {currentEp?.name || `Tập ${ep + 1}`}
            </p>
            {savedPct > 0 && (
              <div className="mt-2 max-w-sm">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {savedPct >= 95
                      ? "Bạn đã xem xong tập này"
                      : `Tiếp tục từ ${formatTime(saved!.position)} · ${savedPct}%`}
                  </span>
                  {savedPct < 95 && <span>{formatTime(saved!.duration)}</span>}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${savedPct}%` }} />
                </div>
              </div>
            )}
          </div>


          {/* Source switcher */}
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <SourcePing
              value={source}
              allowAll={false}
              onChange={(s) => changeSource(s as SourceId)}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {currentEp?.m3u8 && currentEp?.embed
                ? "Nguồn này hỗ trợ HLS và Embed."
                : currentEp?.m3u8
                  ? "Nguồn này phát bằng HLS."
                  : "Nguồn này chỉ phát bằng Embed."}{" "}
              Đổi nguồn API nếu tập hiện tại lỗi. Ping đo tự động, chọn nguồn xanh cho tốc độ tốt nhất.
            </p>
          </div>

          {/* Language filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Ngôn ngữ:</span>
            {langGroups.vietsub.length > 0 && (
              <button
                onClick={() => goSrv(langGroups.vietsub[0])}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  detectLang(currentServer?.server_name || "") === "vietsub"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <Languages className="h-3.5 w-3.5" /> Vietsub ({langGroups.vietsub.length})
              </button>
            )}
            {langGroups.thuyetminh.length > 0 && (
              <button
                onClick={() => goSrv(langGroups.thuyetminh[0])}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  detectLang(currentServer?.server_name || "") === "thuyetminh"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Thuyết Minh ({langGroups.thuyetminh.length})
              </button>
            )}
            {langGroups.other.length > 0 && (
              <button
                onClick={() => goSrv(langGroups.other[0])}
                className={`rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-primary/50 ${
                  detectLang(currentServer?.server_name || "") === "other" ? "border-primary bg-primary/15 text-primary" : ""
                }`}
              >
                Khác ({langGroups.other.length})
              </button>
            )}
          </div>

          {/* Server tabs */}
          {servers.length > 1 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Máy chủ phát</h3>
              <div className="flex flex-wrap gap-2">
                {servers.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => goSrv(i)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                      i === srv
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {s.server_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Episode list */}
        <aside className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Danh sách tập</h3>
              <span className="text-xs text-muted-foreground">{eps.length} tập</span>
            </div>

            {groups.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <button
                    key={g.start}
                    onClick={() => setGroupStart(g.start)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                      clampedGroupStart === g.start
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {g.start + 1}-{g.end + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5">
              {visibleEps.map((e, i) => {
                const idx = clampedGroupStart + i;
                const active = idx === ep;
                return (
                  <button
                    key={idx}
                    onClick={() => goEp(idx)}
                    title={e.name}
                    className={`rounded border px-2 py-2 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border bg-background hover:border-primary/60"
                    }`}
                  >
                    {(e.name || `${idx + 1}`).replace(/^Tập\s*/i, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Mẹo phát phim</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Nếu HLS lỗi, bấm nút <b>Embed</b> để chuyển ngay.</li>
              <li>Đổi <b>nguồn API</b> khi ping đỏ hoặc phim không tải.</li>
              <li>Chọn <b>Vietsub</b> hoặc <b>Thuyết Minh</b> theo sở thích.</li>
            </ul>
          </div>
        </aside>
      </div>

      {recommend.length > 0 && (
        <div className="-mx-4 mt-10 md:-mx-10">
          <MovieRow title="Phim đề xuất" movies={recommend} accent="dành cho bạn" />
        </div>
      )}
    </div>
  );
}
