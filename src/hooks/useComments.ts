import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface MovieComment {
  id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author: string;
  avatar: string | null;
}

export function useComments(slug: string) {
  return useQuery({
    queryKey: ["comments", slug],
    enabled: !!slug,
    queryFn: async (): Promise<MovieComment[]> => {
      const { data, error } = await supabase
        .from("movie_comments")
        .select("id,user_id,content,parent_id,created_at")
        .eq("slug", slug)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      const rows = data ?? [];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      let profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (ids.length) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", ids);
        for (const p of ps ?? []) profiles[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      }
      return rows.map((r) => ({
        ...r,
        author: profiles[r.user_id]?.display_name || "Khán giả ẩn danh",
        avatar: profiles[r.user_id]?.avatar_url ?? null,
      }));
    },
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { slug: string; source: SourceId; content: string; parentId?: string | null }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      const { error } = await supabase.from("movie_comments").insert({
        user_id: user.id,
        slug: v.slug,
        source: v.source,
        content: v.content.trim(),
        parent_id: v.parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["comments", v.slug] }),
  });
}

export function useDeleteComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movie_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", slug] }),
  });
}
