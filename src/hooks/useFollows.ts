import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchDetail } from "@/lib/api";
import type { SourceId } from "@/lib/types";

export interface FollowItem {
  id: string;
  slug: string;
  source: string;
  name: string;
  poster: string | null;
  known_episodes: number;
  last_checked_at: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  slug: string | null;
  source: string | null;
  poster: string | null;
  read: boolean;
  created_at: string;
}

export function useFollows() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follows", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_follows")
        .select("id,slug,source,name,poster,known_episodes,last_checked_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FollowItem[];
    },
  });
}

export function useIsFollowing(slug: string) {
  const { data } = useFollows();
  return !!data?.some((f) => f.slug === slug);
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movie: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      episodes: number;
      following: boolean;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      if (movie.following) {
        const { error } = await supabase.from("series_follows").delete().eq("user_id", user.id).eq("slug", movie.slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("series_follows").upsert(
          {
            user_id: user.id,
            slug: movie.slug,
            name: movie.name,
            poster: movie.poster ?? null,
            source: movie.source,
            known_episodes: movie.episodes,
            last_checked_at: new Date().toISOString(),
          } as never,
          { onConflict: "user_id,slug" },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follows"] }),
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,slug,source,poster,read,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AppNotification[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id?: string) => {
      if (!user) return;
      let q = supabase.from("notifications").update({ read: true } as never).eq("user_id", user.id);
      if (id) q = q.eq("id", id);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** Quét phim đang theo dõi, tạo thông báo khi có tập mới (tối đa 1 lần / 30 phút) */
export function useEpisodeWatcher() {
  const { user } = useAuth();
  const { data: follows } = useFollows();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || !follows?.length) return;
    const key = `lv-ep-check-${user.id}`;
    const last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last < 30 * 60_000) return;
    localStorage.setItem(key, String(Date.now()));

    let cancelled = false;
    (async () => {
      for (const f of follows) {
        try {
          const detail = await fetchDetail(f.slug, f.source as SourceId);
          if (cancelled) return;
          const count = Math.max(0, ...(detail.servers || []).map((s) => s.items.length));
          if (count > f.known_episodes) {
            await supabase.from("notifications").insert({
              user_id: user.id,
              title: `${f.name} có tập mới`,
              body: `Đã cập nhật tới tập ${count}${detail.episode_current ? ` · ${detail.episode_current}` : ""}`,
              slug: f.slug,
              source: f.source,
              poster: f.poster,
            } as never);
            await supabase
              .from("series_follows")
              .update({ known_episodes: count, last_checked_at: new Date().toISOString() } as never)
              .eq("id", f.id);
          } else {
            await supabase
              .from("series_follows")
              .update({ last_checked_at: new Date().toISOString() } as never)
              .eq("id", f.id);
          }
        } catch {
          /* bỏ qua nguồn lỗi */
        }
      }
      if (!cancelled) {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["follows"] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, follows?.length]);
}
