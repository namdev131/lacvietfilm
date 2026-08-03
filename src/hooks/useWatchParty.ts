import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface Party {
  id: string;
  code: string;
  host_id: string;
  slug: string;
  source: string;
  name: string;
  poster: string | null;
  ep_index: number;
  srv_index: number;
  position_seconds: number;
  is_playing: boolean;
  closed: boolean;
  /** 'all' = mọi người được chat, 'host' = chỉ chủ phòng */
  chat_mode: "all" | "host";
  updated_at: string;
}

export interface PartyMessage {
  id: string;
  party_id: string;
  user_id: string;
  display_name: string | null;
  content: string;
  created_at: string;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function useCreateParty() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (movie: {
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
      ep: number;
      srv: number;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      const code = makeCode();
      const { data, error } = await supabase
        .from("watch_parties")
        .insert({
          code,
          host_id: user.id,
          slug: movie.slug,
          source: movie.source,
          name: movie.name,
          poster: movie.poster ?? null,
          ep_index: movie.ep,
          srv_index: movie.srv,
        } as never)
        .select("code")
        .single();
      if (error) throw error;
      return (data as unknown as { code: string }).code;
    },
  });
}

/** Phòng xem chung, tự cập nhật realtime */
export function useParty(code: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["party", code],
    queryFn: async () => {
      const { data, error } = await supabase.from("watch_parties").select("*").eq("code", code).maybeSingle();
      if (error) throw error;
      return (data as unknown as Party) ?? null;
    },
  });

  const id = query.data?.id;
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`party-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "watch_parties", filter: `id=eq.${id}` },
        (payload) => qc.setQueryData(["party", code], payload.new as Party),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, code, qc]);

  // Đồng bộ lại khi người dùng quay lại tab / có mạng trở lại
  useEffect(() => {
    const refetch = () => {
      if (document.visibilityState === "visible") void query.refetch();
    };
    document.addEventListener("visibilitychange", refetch);
    window.addEventListener("focus", refetch);
    window.addEventListener("online", refetch);
    return () => {
      document.removeEventListener("visibilitychange", refetch);
      window.removeEventListener("focus", refetch);
      window.removeEventListener("online", refetch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return query;
}

/** Chủ phòng đẩy trạng thái phát cho mọi người */
export function usePartySync(party: Party | null | undefined, isHost: boolean) {
  const qc = useQueryClient();
  return async (
    patch: Partial<Pick<Party, "ep_index" | "srv_index" | "position_seconds" | "is_playing" | "closed" | "chat_mode">>,
  ) => {
    if (!party || !isHost) return;
    // cập nhật lạc quan để chủ phòng thấy ngay
    qc.setQueryData(["party", party.code], { ...party, ...patch, updated_at: new Date().toISOString() });
    await supabase
      .from("watch_parties")
      .update({ ...patch, updated_at: new Date().toISOString() } as never)
      .eq("id", party.id);
  };
}

/** Chủ phòng đóng phòng xem chung */
export function useCloseParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (party: Party) => {
      const { error } = await supabase.from("watch_parties").update({ closed: true } as never).eq("id", party.id);
      if (error) throw error;
      return party.code;
    },
    onSuccess: (code) => qc.invalidateQueries({ queryKey: ["party", code] }),
  });
}


export function usePartyChat(partyId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [typingKey] = useState(() => Math.random().toString(36).slice(2));

  const query = useQuery({
    queryKey: ["party-chat", partyId],
    enabled: !!partyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_party_messages")
        .select("*")
        .eq("party_id", partyId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as PartyMessage[];
    },
  });

  useEffect(() => {
    if (!partyId) return;
    const channel = supabase
      .channel(`party-chat-${partyId}-${typingKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "watch_party_messages", filter: `party_id=eq.${partyId}` },
        (payload) =>
          qc.setQueryData(["party-chat", partyId], (old: PartyMessage[] | undefined) => [
            ...(old ?? []).filter((m) => m.id !== (payload.new as PartyMessage).id),
            payload.new as PartyMessage,
          ]),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [partyId, qc, typingKey]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !partyId) throw new Error("Bạn cần đăng nhập");
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      const { error } = await supabase.from("watch_party_messages").insert({
        party_id: partyId,
        user_id: user.id,
        display_name: meta.display_name || meta.full_name || user.email?.split("@")[0] || "Khán giả",
        content,
      } as never);
      if (error) throw error;
    },
  });

  return { ...query, send };
}

/** Số người đang trong phòng (presence) */
export function usePartyPresence(code: string, name: string) {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const channel = supabase.channel(`party-presence-${code}`, { config: { presence: { key: name } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length || 1);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code, name]);
  return count;
}
