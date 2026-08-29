import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";
import { partyIdentity, type AdminRole } from "@/lib/admin-role";

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
      const { data, error } = await supabase.rpc("create_watch_party", {
        _slug: movie.slug,
        _source: movie.source,
        _name: movie.name,
        _poster: movie.poster,
        _ep_index: movie.ep,
        _srv_index: movie.srv,
      });
      if (error) throw error;
      if (typeof data !== "string") throw new Error("Không tạo được mã phòng");
      return data;
    },
  });
}

/** Phòng xem chung, tự cập nhật realtime */
export function useParty(code: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["party", code],
    queryFn: async () => {
      const { data: joined, error: joinError } = await supabase.rpc("join_party", { _code: code });
      if (joinError) throw joinError;
      if (!joined) return null;
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

  // Kéo lại tin nhắn đã lỡ khi quay lại tab
  useEffect(() => {
    if (!partyId) return;
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
  }, [partyId]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !partyId) throw new Error("Bạn cần đăng nhập");
      const identity = partyIdentity(user);
      const { error } = await supabase.from("watch_party_messages").insert({
        party_id: partyId,
        user_id: user.id,
        display_name: identity.name,
        content,
      } as never);
      if (error) throw error;
    },
  });

  return { ...query, send };
}

/** Số người đang trong phòng (presence) */
export interface PartyStaffNotice { id: string; name: string; role: Exclude<AdminRole, "member"> }

export function usePartyPresence(code: string) {
  const { user } = useAuth();
  const [count, setCount] = useState(1);
  const [staffNotice, setStaffNotice] = useState<PartyStaffNotice | null>(null);
  useEffect(() => {
    if (!user) return;
    const identity = partyIdentity(user);
    const channel = supabase.channel(`party-presence-${code}`, { config: { presence: { key: user.id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PartyStaffNotice & { at: number }>();
        setCount(Object.keys(state).length || 1);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const staff = (newPresences as unknown as Array<PartyStaffNotice & { at: number }>).find(
          (entry) => entry.id !== user.id && entry.role !== "member",
        );
        if (staff) setStaffNotice({ id: staff.id, name: staff.name, role: staff.role });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ ...identity, at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code, user]);
  return { count, staffNotice, clearStaffNotice: () => setStaffNotice(null) };
}
