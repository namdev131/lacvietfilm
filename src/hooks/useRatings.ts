import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface RatingReview {
  user_id: string;
  score: number;
  review: string;
  display_name: string;
  updated_at: string;
}
export interface RatingSummary {
  avg: number;
  count: number;
  mine: { score: number; review: string | null; status: "visible" | "hidden" } | null;
  reviews: RatingReview[];
}

async function token() {
  return (await supabase.auth.getSession()).data.session?.access_token;
}

export function useRating(slug: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rating", slug, user?.id ?? "anon"],
    enabled: !!slug,
    queryFn: async (): Promise<RatingSummary> => {
      const accessToken = await token();
      const response = await fetch(`/api/ratings?slug=${encodeURIComponent(slug)}`, {
        headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
      });
      const result = (await response.json()) as RatingSummary & { error?: string };
      if (!response.ok) throw new Error(result.error || "Không tải được đánh giá");
      return result;
    },
  });
}

export function useRateMovie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      score: number;
      review: string;
    }) => {
      const accessToken = await token();
      if (!accessToken) throw new Error("Bạn cần đăng nhập");
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(value),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Không lưu được đánh giá");
    },
    onSuccess: (_data, value) => qc.invalidateQueries({ queryKey: ["rating", value.slug] }),
  });
}
