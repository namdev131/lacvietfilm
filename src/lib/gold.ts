import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MovieDetail, SourceId } from "@/lib/types";

export type GoldPeriod = "day" | "week" | "month" | "all";
export type GoldKind = "all" | "single" | "series" | "anime";

export interface GoldRow {
  slug: string;
  name: string;
  poster: string | null;
  source: SourceId;
  kind: string;
  views: number;
  rank: number;
  prev_rank: number | null;
}

export const PERIOD_LABEL: Record<GoldPeriod, string> = {
  day: "Hôm nay",
  week: "Tuần",
  month: "Tháng",
  all: "Mọi lúc",
};

export const KIND_LABEL: Record<GoldKind, string> = {
  all: "Tất cả",
  single: "Phim lẻ",
  series: "Phim bộ",
  anime: "Anime",
};

export function detectKind(d: Pick<MovieDetail, "category" | "servers">): GoldKind {
  const cats = (d.category || []).join(" ").toLowerCase();
  if (cats.includes("hoạt hình") || cats.includes("anime")) return "anime";
  const eps = d.servers?.[0]?.items?.length ?? 1;
  return eps > 1 ? "series" : "single";
}

/** Ghi nhận 1 lượt xem cho Bảng Vàng (chống spam bằng sessionStorage 10 phút) */
export async function recordView(entry: {
  slug: string;
  name: string;
  poster?: string;
  source: SourceId;
  kind?: GoldKind;
  lang?: string;
  userId?: string | null;
}) {
  try {
    const key = `lv-view:${entry.slug}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 10 * 60 * 1000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore */
  }
  await supabase.from("view_events").insert({
    user_id: entry.userId ?? null,
    slug: entry.slug,
    name: entry.name,
    poster: entry.poster ?? null,
    source: entry.source,
    kind: entry.kind ?? "other",
    lang: entry.lang ?? "vietsub",
  });
}

export function useGoldBoard(period: GoldPeriod, kind: GoldKind) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["gold-board", period, kind],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("gold_board" as never, {
        _period: period,
        _kind: kind,
        _limit: 10,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as GoldRow[];
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("gold-board-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "view_events" }, () => {
        qc.invalidateQueries({ queryKey: ["gold-board"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

/** Số người đang online trên trang, qua Realtime presence */
export function useLiveViewers() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = Math.random().toString(36).slice(2);
    const channel = supabase.channel("lv-presence", { config: { presence: { key: id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") channel.track({ at: Date.now() });
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return count;
}
