import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface WatchlistItem {
  slug: string;
  name: string;
  poster: string | null;
  source: string;
  note: string | null;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["watchlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("slug,name,poster,source,note,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WatchlistItem[];
    },
  });
}

export function useInWatchlist(slug: string) {
  const { data } = useWatchlist();
  return !!data?.some((m) => m.slug === slug);
}

export function useToggleWatchlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movie: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      inList: boolean;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      if (movie.inList) {
        const { error } = await supabase.from("watchlist").delete().eq("user_id", user.id).eq("slug", movie.slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("watchlist").upsert(
          {
            user_id: user.id,
            slug: movie.slug,
            name: movie.name,
            poster: movie.poster ?? null,
            source: movie.source,
          } as never,
          { onConflict: "user_id,slug" },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("watchlist").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}
