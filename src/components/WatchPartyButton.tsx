import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCreateParty } from "@/hooks/useWatchParty";
import type { SourceId } from "@/lib/types";

export function WatchPartyButton({
  slug,
  name,
  poster,
  source,
  ep,
  srv,
}: {
  slug: string;
  name: string;
  poster?: string;
  source: SourceId;
  ep: number;
  srv: number;
}) {
  const { user } = useAuth();
  const create = useCreateParty();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => {
          if (!user) {
            toast.info("Đăng nhập để mở phòng xem chung");
            navigate({ to: "/auth" });
            return;
          }
          create.mutate(
            { slug, name, poster, source, ep, srv },
            {
              onSuccess: (partyCode) => navigate({ to: "/party/$code", params: { code: partyCode } }),
              onError: () => toast.error("Không mở được phòng, thử lại nhé"),
            },
          );
        }}
        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition hover:border-primary/60 hover:text-primary"
      >
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        Xem chung
      </button>

      {joining ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c.length < 4) return toast.error("Mã phòng không hợp lệ");
            navigate({ to: "/party/$code", params: { code: c } });
          }}
          className="flex items-center gap-2"
        >
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MÃ PHÒNG"
            maxLength={8}
            className="w-32 rounded-md border border-border bg-card px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-primary/60"
          />
          <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Vào</button>
        </form>
      ) : (
        <button
          onClick={() => setJoining(true)}
          className="rounded-md border border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:border-primary/60 hover:text-primary"
        >
          Nhập mã phòng
        </button>
      )}
    </div>
  );
}
