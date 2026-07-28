import { useEffect, useState } from "react";
import { SOURCES, pingSource } from "@/lib/api";
import type { SourceFilter, SourceId } from "@/lib/types";
import { Activity, Layers } from "lucide-react";

export function SourcePing({
  value,
  onChange,
  compact,
  allowAll = true,
}: {
  value: SourceFilter;
  onChange: (s: SourceFilter) => void;
  compact?: boolean;
  allowAll?: boolean;
}) {
  const [pings, setPings] = useState<Record<SourceId, number | null>>({
    kkphim: null,
    ophim: null,
    nguonc: null,
    vsmov: null,
  });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const results = await Promise.all(SOURCES.map((s) => pingSource(s.id)));
      if (!alive) return;
      const next: any = {};
      SOURCES.forEach((s, i) => (next[s.id] = results[i]));
      setPings(next);
    };
    run();
    const t = setInterval(run, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);


  const pingColor = (p: number | null) => {
    if (p == null) return "text-muted-foreground";
    if (p < 0) return "text-red-400";
    if (p < 300) return "text-emerald-400";
    if (p < 800) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "text-sm"}`}>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5" /> Nguồn API
      </span>
      {allowAll && (
        <button
          onClick={() => onChange("all")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            value === "all"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-card/60 text-foreground hover:border-primary/50"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> Tất cả
        </button>
      )}

      {SOURCES.map((s) => {
        const active = value === s.id;
        const p = pings[s.id];
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card/60 text-foreground hover:border-primary/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                p == null
                  ? "bg-muted-foreground animate-pulse"
                  : p < 0
                    ? "bg-red-500"
                    : p < 300
                      ? "bg-emerald-500"
                      : p < 800
                        ? "bg-yellow-500"
                        : "bg-orange-500"
              }`}
            />
            {s.label}
            <span className={`tabular-nums ${pingColor(p)}`}>
              {p == null ? "…" : p < 0 ? "lỗi" : `${p}ms`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
