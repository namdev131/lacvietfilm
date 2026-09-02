import { useEffect, useState } from "react";
import { SOURCES, pingSource } from "@/lib/api";
import type { SourceFilter, SourceId } from "@/lib/types";
import { Activity, Check, ChevronsUpDown, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SourcePing({
  value,
  onChange,
  compact,
  allowAll = true,
  sources,
}: {
  value: SourceFilter;
  onChange: (s: SourceFilter) => void;
  compact?: boolean;
  allowAll?: boolean;
  sources?: SourceId[];
}) {
  const [open, setOpen] = useState(false);
  const [pings, setPings] = useState<Partial<Record<SourceId, number | null>>>({});
  const available = SOURCES.filter((source) => !sources || sources.includes(source.id));
  const active = value === "all" ? null : SOURCES.find((source) => source.id === value);
  const activePing = value === "all" ? null : pings[value];

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const results = await Promise.all(SOURCES.map((source) => pingSource(source.id)));
      if (!alive) return;
      setPings(Object.fromEntries(SOURCES.map((source, index) => [source.id, results[index]])));
    };
    run();
    const timer = window.setInterval(run, 30_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const select = (source: SourceFilter) => {
    onChange(source);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Đổi nguồn API"
          className={`group inline-flex items-center rounded-full border border-primary/45 bg-primary/10 text-left shadow-sm transition hover:border-primary hover:bg-primary/15 active:scale-[0.98] ${
            compact ? "gap-1.5 px-2.5 py-1.5" : "gap-2 px-3 py-2"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {value === "all" ? <Layers className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold leading-none text-muted-foreground">
              Nguồn đang dùng
            </span>
            <span className="mt-1 block max-w-32 truncate text-xs font-bold leading-none text-foreground">
              {active?.label || "Tất cả nguồn"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`ml-0.5 h-2 w-2 shrink-0 rounded-full ${
              value === "all" || activePing == null
                ? "bg-muted-foreground"
                : activePing < 0
                  ? "bg-red-500"
                  : "bg-emerald-500"
            }`}
          />
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3">
        <div className="mb-3 px-1">
          <div className="text-sm font-bold">Chọn nguồn API</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Chọn thủ công nguồn phim bạn muốn sử dụng.</p>
        </div>

        <div role="radiogroup" aria-label="Nguồn phim" className="grid grid-cols-2 gap-2">
          {allowAll && (
            <SourceOption
              label="Tất cả nguồn"
              detail="Tự gộp kết quả"
              selected={value === "all"}
              onSelect={() => select("all")}
            />
          )}
          {available.map((source) => (
            <SourceOption
              key={source.id}
              label={source.label}
              detail={formatPing(pings[source.id])}
              ping={pings[source.id]}
              selected={value === source.id}
              onSelect={() => select(source.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SourceOption({
  label,
  detail,
  ping,
  selected,
  onSelect,
}: {
  label: string;
  detail: string;
  ping?: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative min-w-0 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] ${
        selected
          ? "border-primary bg-primary/12 text-foreground"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/60"
      }`}
    >
      <span className="flex items-center gap-2">
        {ping !== undefined && (
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${
              ping == null ? "bg-muted-foreground" : ping < 0 ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
        )}
        <span className="truncate text-xs font-bold">{label}</span>
        {selected && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
      </span>
      <span className="mt-1 block truncate text-[10px] text-muted-foreground">{detail}</span>
    </button>
  );
}

function formatPing(ping: number | null | undefined) {
  if (ping == null) return "Đang kiểm tra";
  return ping < 0 ? "Tạm gián đoạn" : `${ping}ms`;
}
