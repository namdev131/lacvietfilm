import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface RatingSummary {
  avg: number;
  count: number;
  mine: number | null;
}

export function useRating(slug: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rating", slug, user?.id ?? "anon"],
    enabled: !!slug,
    queryFn: async (): Promise<RatingSummary> => {
      // Chỉ lấy số liệu tổng hợp công khai (không lộ ai đã chấm điểm)
      const { data, error } = await supabase.rpc("rating_summary" as never, { _slug: slug } as never);
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { avg: number | string; count: number } | undefined;
      const avg = Number(row?.avg ?? 0);
      const count = Number(row?.count ?? 0);

      let mine: number | null = null;
      if (user) {
        const { data: own } = await supabase
          .from("movie_ratings")
          .select("score")
          .eq("slug", slug)
          .eq("user_id", user.id)
          .maybeSingle();
        mine = (own as { score: number } | null)?.score ?? null;
      }
      return { avg, count, mine };
    },
  });
}

export function useRateMovie() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      score: number;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      const { error } = await supabase.from("movie_ratings").upsert(
        {
          user_id: user.id,
          slug: v.slug,
          name: v.name,
          poster: v.poster ?? null,
          source: v.source,
          score: v.score,
        },
        { onConflict: "user_id,slug" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["rating", v.slug] }),
  });
}
