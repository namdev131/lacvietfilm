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
      const { data, error } = await supabase
        .from("movie_ratings")
        .select("score,user_id")
        .eq("slug", slug);
      if (error) throw error;
      const rows = data ?? [];
      const count = rows.length;
      const avg = count ? rows.reduce((s, r) => s + (r.score ?? 0), 0) / count : 0;
      const mine = user ? (rows.find((r) => r.user_id === user.id)?.score ?? null) : null;
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
