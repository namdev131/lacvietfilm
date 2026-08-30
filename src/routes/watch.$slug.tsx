import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { recordHistory } from "@/hooks/useUserData";
import { recordView, detectKind } from "@/lib/gold";
import { ArrowLeft, Film, Info, Languages, Mic, Play, Zap } from "lucide-react";
import { fetchDetail, fetchLatestMerged, searchMovies, SOURCES } from "@/lib/api";
import { type PlayMode } from "@/components/Player";
import { usePlayerHost, usePlayerDock } from "@/components/PlayerHost";
import { MovieRow } from "@/components/MovieRow";
import { SourcePing } from "@/components/SourcePing";
import { WatchPartyButton } from "@/components/WatchPartyButton";
import type { SourceId } from "@/lib/types";
import { getLocalProgress, progressPercent, formatTime } from "@/lib/progress";
import { useSettings } from "@/lib/settings";
import { CinemaTicket } from "@/components/CinemaTicket";
import { ticketOwnerLabel } from "@/lib/tickets";


const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
  ep: z.number().int().min(0).default(0),
  srv: z.number().int().min(0).default(0),
});

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Xem phim — Lạc Việt Film" },
      { name: "description", content: "Xem phim trực tuyến trên Lạc Việt Film." },
      { property: "og:title", content: "Xem phim — Lạc Việt Film" },
      { property: "og:description", content: "Xem phim trực tuyến trên Lạc Việt Film." },
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

const movieKey = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/g, "");

function WatchPage() {
  const { slug } = Route.useParams();
  const { src, ep, srv } = Route.useSearch();
  const navigate = useNavigate();
  const source = src as SourceId;
  const { user } = useAuth();

  const hlsSources: SourceId[] = ["kkphim", "ophim", "vsmov"];
  const allowHls = hlsSources.includes(source);
  const { settings } = useSettings();
  const preferHls = allowHls && settings.defaultMode === "hls";
  const [mode, setMode] = useState<PlayMode>(preferHls ? "hls" : "embed");

  useEffect(() => {
    setMode(preferHls ? "hls" : "embed");
  }, [preferHls]);
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

  const { data: sourceMatches = [] } = useQuery({
    queryKey: ["source-matches", data?.name, data?.year],
    enabled: !!data?.name,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const expected = movieKey(data!.origin_name || data!.name);
      const lists = await Promise.all(
        SOURCES.map(async ({ id }) => [id, await searchMovies(data!.name, id).catch(() => [])] as const),
      );
      return lists.flatMap(([id, movies]) => {
        const sourceMatch = movies.find((movie) =>
          movieKey(movie.origin_name || movie.name) === expected &&
          (!data!.year || !movie.year || String(movie.year) === String(data!.year)),
        );
        return sourceMatch ? [{ ...sourceMatch, source: id }] : [];
      });
    },
  });
  const availableSources = sourceMatches.map((movie) => movie.source);

  const servers = useMemo(
    () => (data?.servers || []).filter((server) => server.items.some((item) => item.m3u8 || item.embed)),
    [data],
  );
  const currentServer = servers[srv] || servers[0];
  const currentEp = currentServer?.items[ep];
  const ticketOwner = ticketOwnerLabel(user ? {
    displayName: (user.user_metadata?.display_name || user.user_metadata?.full_name) as string | undefined,
    email: user.email,
  } : null);

  // Group servers by language
  const langGroups = useMemo(() => {
    if (!data) return { vietsub: [] as number[], thuyetminh: [] as number[], other: [] as number[] };
    const g: any = { vietsub: [], thuyetminh: [], other: [] };
    servers.forEach((s, i) => g[detectLang(s.server_name)].push(i));
    return g;
  }, [data, servers]);

  // Tự chọn server theo ngôn ngữ ưu tiên trong Cài đặt
  useEffect(() => {
    if (!servers.length || settings.langPref === "auto") return;
    const wanted: number[] = (langGroups as any)[settings.langPref] || [];
    if (wanted.length && !wanted.includes(srv)) {
      navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: 0, srv: wanted[0] }, replace: true });
    }
  }, [servers.length, settings.langPref, langGroups, srv, slug, source]);

  const eps = currentServer?.items || [];

  // Ghi nhận lượt xem cho Bảng Vàng (kể cả khách chưa đăng nhập)
  useEffect(() => {
    if (!data) return;
    recordView({
      slug: data.slug,
      name: data.name,
      canonicalName: data.origin_name,
      poster: data.poster,
      source,
      kind: detectKind(data),
      lang: detectLang(currentServer?.server_name || ""),
      userId: user?.id ?? null,
    });
  }, [data?.slug, source, user?.id]);

  useEffect(() => {
    if (!user || !data || !settings.saveHistory) return;
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
  }, [user, data, source, ep, srv, currentEp?.slug, currentEp?.name, settings.saveHistory]);


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
      hasNext: ep + 1 < (currentServer?.items.length ?? 0),
      nextLabel: currentServer?.items[ep + 1]?.name || `Tập ${ep + 2}`,
      onNext: () => {
        const total = currentServer?.items.length ?? 0;
        if (ep + 1 < total) {
          navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: ep + 1, srv } });
        }
      },

    });
  }, [data?.slug, slug, source, ep, srv, currentEp?.m3u8, currentEp?.embed, mode, allowHls, settings.autoNext, currentServer?.items.length]);

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
  const changeSource = (s: SourceId) => {
    const sourceMatch = sourceMatches.find((movie) => movie.source === s);
    if (sourceMatch) navigate({ to: "/watch/$slug", params: { slug: sourceMatch.slug }, search: { src: s, ep: 0, srv: 0 } });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-10">
        <div ref={dockRef} className="aspect-video w-full overflow-hidden rounded-lg bg-card shimmer" />
      </div>
    );
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
    <div className="mx-auto max-w-[1600px] bg-[#03070d] px-3 py-4 text-[#f4f5f7] md:px-6">
      <div className="mb-3 flex items-center gap-3">
        <Link to="/movie/$slug" params={{ slug }} search={{ src: source }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Chi tiết phim
        </Link>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div ref={dockRef} className="aspect-video max-h-[calc(100vh-8rem)] w-full overflow-hidden rounded-md bg-black ring-1 ring-[#202936]" />

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


          <CinemaTicket
            slug={data.slug}
            name={data.name}
            poster={data.poster}
            source={source}
            userId={user?.id}
            owner={ticketOwner}
            episode={currentEp?.name || `Tập ${ep + 1}`}
          />

          {/* Xem chung */}
          {data && (
            <div className="rounded-xl border border-border/60 bg-card/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Xem chung với bạn bè</p>
              <WatchPartyButton slug={slug} name={data.name} poster={data.poster} source={source} ep={ep} srv={srv} />
            </div>
          )}

          {/* Source switcher */}
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <SourcePing
              value={source}
              allowAll={false}
              sources={availableSources.length ? availableSources : [source]}
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
        <aside className="space-y-3 xl:col-start-2 xl:row-start-1">
          <div className="rounded-md border border-[#202936] bg-[#070c14] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Danh sách tập</h3>
              <span className="text-xs text-[#8e97a4]">{eps.length} tập</span>
            </div>
            <div className="max-h-[430px] space-y-1 overflow-y-auto pr-1">
              {eps.map((e, idx) => {
                const active = idx === ep;
                return (
                  <button
                    key={idx}
                    onClick={() => goEp(idx)}
                    title={e.name}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-medium transition ${active ? "bg-[#18202b] text-amber-300" : "text-[#b7bec8] hover:bg-[#111923] hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2"><Play className="h-3 w-3 fill-current" />{e.name || `Tập ${idx + 1}`}{active ? " - Hiện tại" : ""}</span>
                    {active && <span className="flex items-end gap-0.5"><i className="h-2 w-0.5 animate-pulse bg-amber-300" /><i className="h-3 w-0.5 animate-pulse bg-amber-300" /><i className="h-1.5 w-0.5 animate-pulse bg-amber-300" /></span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden rounded-md border border-[#202936] bg-[#070c14] p-4 text-xs text-[#9ea6b2] xl:block">
            <p className="font-semibold text-white">Phím tắt</p>
            <dl className="mt-3 space-y-2">
              {[["Phát / Tạm dừng", "Space"], ["Tua nhanh 10s", "→"], ["Tua lùi 10s", "←"], ["Âm lượng", "↑ / ↓"], ["Tắt tiếng", "M"], ["Toàn màn hình", "F / Nhấp đúp"], ["Thoát toàn màn hình", "Esc"]].map(([label, key]) => <div key={label} className="flex justify-between"><dt>{label}</dt><dd className="text-white">{key}</dd></div>)}
            </dl>
            <p className="mt-4 flex gap-1.5 border-t border-[#202936] pt-3 text-[11px] leading-4 text-amber-300"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Nếu không xem được, hãy thử đổi máy chủ khác nhé!</p>
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
