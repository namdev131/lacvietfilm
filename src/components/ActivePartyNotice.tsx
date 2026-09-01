import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ACTIVE_PARTY_KEY, clearActiveParty, type ActiveParty } from "@/hooks/useWatchParty";

function readActiveParty(): ActiveParty | null {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVE_PARTY_KEY) || "null") as ActiveParty | null;
    return value?.code && value?.name ? value : null;
  } catch {
    return null;
  }
}

export function ActivePartyNotice() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [party, setParty] = useState<ActiveParty | null>(null);

  useEffect(() => {
    const update = () => setParty(readActiveParty());
    update();
    window.addEventListener("active-party-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("active-party-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!party || pathname === `/party/${party.code}`) return null;

  return (
    <aside role="status" aria-live="polite" className="active-party-notice fixed left-1/2 top-16 z-[70] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/45 bg-card/95 px-4 py-3 text-foreground shadow-xl backdrop-blur-md md:top-20">
      <Users className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <strong className="block text-sm">Bạn đang trong 1 phòng xem chung</strong>
        <span className="block truncate text-xs text-muted-foreground">{party.name}</span>
      </div>
      <Link to="/party/$code" params={{ code: party.code }} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Vào lại</Link>
      <button type="button" onClick={() => { clearActiveParty(); setParty(null); }} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-destructive/60 hover:text-destructive">Hủy</button>
    </aside>
  );
}
