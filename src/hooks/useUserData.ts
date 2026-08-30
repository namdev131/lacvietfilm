import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";
import { watchHistoryApi } from "@/lib/watchHistoryApi";

export interface LibraryItem {
  slug: string;
  name: string;
  poster: string | null;
  source: string;
  episode_slug?: string | null;
  episode_name?: string | null;
  watched_at?: string;
  position_seconds?: number;
  duration_seconds?: number;
  ep_index?: number;
  srv_index?: number;
  finished?: boolean;
}

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("slug,name,poster,source")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LibraryItem[];
    },
  });
}

export function useIsFavorite(slug: string) {
  const { data } = useFavorites();
  return !!data?.some((f) => f.slug === slug);
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movie: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      isFav: boolean;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      if (movie.isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("slug", movie.slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").upsert(
          {
            user_id: user.id,
            slug: movie.slug,
            name: movie.name,
            poster: movie.poster ?? null,
            source: movie.source,
          },
          { onConflict: "user_id,slug" },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export function useHistory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const refresh = () => qc.invalidateQueries({ queryKey: ["history", user.id] });
    window.addEventListener("lv-history-sync", refresh);
    return () => window.removeEventListener("lv-history-sync", refresh);
  }, [qc, user?.id]);
  return useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await watchHistoryApi("list");
      return (data.history ?? []) as LibraryItem[];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export async function recordHistory(
  userId: string,
  entry: {
    slug: string;
    name: string;
    poster?: string;
    source: SourceId;
    episode_slug?: string;
    episode_name?: string;
    ep_index?: number;
    srv_index?: number;
  },
) {
  void userId;
  await watchHistoryApi("record", entry);
}
