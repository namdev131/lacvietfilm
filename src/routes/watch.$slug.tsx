import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { recordHistory } from "@/hooks/useUserData";
import { recordView, detectKind } from "@/lib/gold";
import { ArrowLeft, Languages, Mic } from "lucide-react";
import { fetchDetail } from "@/lib/api";
import { Player, type PlayMode } from "@/components/Player";
import { SourcePing } from "@/components/SourcePing";
import type { SourceId } from "@/lib/types";

const searchSchema = z.object({
  src: z.enum(["kkphim", "ophim", "nguonc"]).default("kkphim"),
  ep: z.number().int().min(0).default(0),
  srv: z.number().int().min(0).default(0),
});

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: searchSchema,
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

  const [mode, setMode] = useState<PlayMode>("hls");
  const [groupStart, setGroupStart] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["detail", source, slug],
    queryFn: () => fetchDetail(slug, source),
  });

  const currentServer = data?.servers[srv];
  const currentEp = currentServer?.items[ep];

  // Group servers by language
  const langGroups = useMemo(() => {
    if (!data) return { vietsub: [] as number[], thuyetminh: [] as number[], other: [] as number[] };
    const g: any = { vietsub: [], thuyetminh: [], other: [] };
    data.servers.forEach((s, i) => g[detectLang(s.server_name)].push(i));
    return g;
  }, [data]);

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
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["history"] });
    });
  }, [user, data, source, currentEp?.slug, currentEp?.name]);

  const goEp = (i: number) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: i, srv } });
  const goSrv = (i: number) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: source, ep: 0, srv: i } });
  const changeSource = (s: SourceId) => navigate({ to: "/watch/$slug", params: { slug }, search: { src: s, ep: 0, srv: 0 } });

  if (isLoading || !data) {
    return <div className="mx-auto max-w-6xl px-4 py-16 md:px-10"><div className="aspect-video rounded-lg bg-card shimmer" /></div>;
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
          <Player
            key={`${srv}-${ep}-${mode}`}
            m3u8={currentEp?.m3u8}
            embed={currentEp?.embed}
            poster={data.thumb || data.poster}
            mode={mode}
            onModeChange={setMode}
            autoFallback
          />

          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentServer?.server_name} · {currentEp?.name || `Tập ${ep + 1}`}
            </p>
          </div>

          {/* Source switcher */}
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <SourcePing value={source} onChange={changeSource} />
            <p className="mt-2 text-[11px] text-muted-foreground">
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
          {data.servers.length > 1 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Máy chủ phát</h3>
              <div className="flex flex-wrap gap-2">
                {data.servers.map((s, i) => (
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
    </div>
  );
}
