import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Crown, DoorClosed, Pause, Play, RefreshCw, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Player, type PlayMode } from "@/components/Player";
import { fetchDetail } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCloseParty, useParty, usePartyChat, usePartyPresence, usePartySync } from "@/hooks/useWatchParty";
import { SignInPrompt } from "@/components/SignInPrompt";
import type { SourceId } from "@/lib/types";


export const Route = createFileRoute("/party/$code")({
  head: () => ({
    meta: [
      { title: "Phòng xem chung | Lạc Việt Cinema" },
      { name: "description", content: "Xem phim cùng bạn bè theo thời gian thực: đồng bộ tập, thời điểm phát và chat trực tiếp trong phòng." },
      { property: "og:title", content: "Xem chung — Lạc Việt Cinema" },
      { property: "og:description", content: "Đồng bộ phim và chat cùng bạn bè theo thời gian thực." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartyPage,
});

function PartyPage() {
  const { code } = Route.useParams();
  const { user, loading } = useAuth();
  const { data: party, isLoading } = useParty(code);
  const isHost = !!user && party?.host_id === user.id;
  const sync = usePartySync(party, isHost);
  const closeParty = useCloseParty();
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const myName = meta.display_name || meta.full_name || user?.email?.split("@")[0] || "Khán giả";
  const viewers = usePartyPresence(code, `${myName}-${user?.id ?? "guest"}`);
  const chat = usePartyChat(party?.id);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PlayMode>("hls");
  const [followHost, setFollowHost] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: detail } = useQuery({
    queryKey: ["detail", party?.source, party?.slug],
    enabled: !!party,
    queryFn: () => fetchDetail(party!.slug, party!.source as SourceId),
  });

  const servers = useMemo(
    () => (detail?.servers || []).filter((s) => s.items.some((i) => i.m3u8 || i.embed)),
    [detail],
  );
  const server = servers[party?.srv_index ?? 0] || servers[0];
  const episode = server?.items[party?.ep_index ?? 0];

  // Trạng thái chủ phòng đẩy xuống cho người xem (bù trễ theo updated_at)
  const syncState = useMemo(
    () =>
      !party || isHost || !followHost
        ? null
        : {
            position: party.position_seconds,
            isPlaying: party.is_playing,
            at: new Date(party.updated_at).getTime(),
          },
    [party?.position_seconds, party?.is_playing, party?.updated_at, isHost, followHost],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.data?.length]);


  if (!loading && !user) {
    return <SignInPrompt title="Phòng xem chung" desc="Đăng nhập để vào phòng, đồng bộ phim và chat cùng bạn bè." />;
  }

  if (isLoading || loading) {
    return <div className="mx-auto max-w-[1400px] px-4 pt-10"><div className="aspect-video w-full rounded-xl bg-card shimmer" /></div>;
  }

  if (!party) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-32 pt-20 text-center">
        <h1 className="text-xl font-bold">Không tìm thấy phòng “{code}”</h1>
        <p className="mt-2 text-sm text-muted-foreground">Phòng có thể đã đóng hoặc mã không đúng.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (party.closed) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-32 pt-20 text-center">
        <DoorClosed className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-xl font-bold">Phòng “{party.code}” đã đóng</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chủ phòng đã kết thúc buổi xem chung.</p>
        <Link
          to="/watch/$slug"
          params={{ slug: party.slug }}
          search={{ src: party.source as SourceId, ep: party.ep_index, srv: party.srv_index }}
          className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Xem tiếp một mình
        </Link>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-32 pt-6 md:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/" className="rounded-full border border-border p-2 hover:border-primary/60" aria-label="Về trang chủ">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black">{party.name}</h1>
          <p className="text-xs text-muted-foreground">
            {server?.server_name} · {episode?.name || `Tập ${party.ep_index + 1}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-primary" /> {viewers} đang xem
          </span>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}/party/${party.code}`);
              toast.success("Đã sao chép link mời");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> Mã {party.code}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Player
              key={`${party.slug}-${party.srv_index}-${party.ep_index}`}
              m3u8={episode?.m3u8}
              embed={episode?.embed}
              poster={detail?.thumb || detail?.poster}
              mode={mode}
              onModeChange={setMode}
              resumeAt={isHost ? 0 : party.position_seconds}
              onProgress={(pos) => {
                if (isHost && Math.abs(pos - party.position_seconds) > 4) void sync({ position_seconds: pos, is_playing: true });
              }}
            />
          </div>

          {isHost && servers.length > 0 && (
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-primary" /> Bạn là chủ phòng — chọn tập cho cả phòng
              </p>
              <div className="flex flex-wrap gap-1.5">
                {servers.map((s, i) => (
                  <button
                    key={s.server_name + i}
                    onClick={() => void sync({ srv_index: i, ep_index: 0, position_seconds: 0 })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      i === party.srv_index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.server_name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(server?.items || []).map((it, i) => (
                  <button
                    key={it.slug || i}
                    onClick={() => void sync({ ep_index: i, position_seconds: 0 })}
                    className={`min-w-10 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      i === party.ep_index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isHost && (
            <p className="mt-3 text-xs text-muted-foreground">
              Chủ phòng đang điều khiển tập phim. Bạn sẽ tự chuyển theo phòng.
            </p>
          )}
        </div>

        {/* Chat */}
        <div className="flex h-[520px] flex-col rounded-xl border border-border bg-card">
          <div className="border-b border-border/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Chat phòng
          </div>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {!chat.data?.length ? (
              <p className="text-sm text-muted-foreground">Chưa có tin nhắn. Chào mọi người nào!</p>
            ) : (
              chat.data.map((m) => {
                const mine = m.user_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {!mine && <div className="text-[11px] font-bold text-primary">{m.display_name}</div>}
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = text.trim();
              if (!v) return;
              setText("");
              chat.send.mutate(v, { onError: () => toast.error("Không gửi được tin nhắn") });
            }}
            className="flex gap-2 border-t border-border/60 p-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Nhắn gì đó…"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button className="rounded-xl bg-primary px-3 text-primary-foreground" aria-label="Gửi">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
