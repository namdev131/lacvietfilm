import { useState } from "react";
import { Clapperboard, Users } from "lucide-react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0] ?? "";
  return (first[0] ?? "").concat(parts.length > 1 ? last[0] ?? "" : "").toUpperCase();
}

function PersonChip({ name, role }: { name: string; role?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card/70 py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-primary/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/30 text-[11px] font-bold text-primary-foreground">
        {initials(name) || "?"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-foreground">{name}</span>
        {role && <span className="block text-[10px] text-muted-foreground">{role}</span>}
      </span>
    </div>
  );
}

export function CastCrew({
  directors = [],
  actors = [],
}: {
  directors?: string[];
  actors?: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const dirs = directors.filter((d) => d && d.trim());
  const cast = actors.filter((a) => a && a.trim());
  if (!dirs.length && !cast.length) return null;

  const visible = showAll ? cast : cast.slice(0, 12);

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-lg font-semibold">Diễn viên &amp; đạo diễn</h2>

      {dirs.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Clapperboard className="h-3.5 w-3.5" /> Đạo diễn
          </div>
          <div className="flex flex-wrap gap-2">
            {dirs.map((d, i) => (
              <PersonChip key={`${d}-${i}`} name={d} role="Đạo diễn" />
            ))}
          </div>
        </div>
      )}

      {cast.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Diễn viên ({cast.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {visible.map((a, i) => (
              <PersonChip key={`${a}-${i}`} name={a} role="Diễn viên" />
            ))}
          </div>
          {cast.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showAll ? "Thu gọn" : `Xem tất cả ${cast.length} diễn viên`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
