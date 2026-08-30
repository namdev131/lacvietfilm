import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";
import { isStaff, staffLabel, staffRole, type StaffRole } from "@/lib/staff";

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

async function partyApi(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Bạn cần đăng nhập");
  const response = await fetch("/api/watch-party", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as { party?: Party | null; error?: string };
  if (!response.ok) throw new Error(result.error || "Không mở được phòng");
  return result.party ?? null;
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
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const bytes = crypto.getRandomValues(new Uint8Array(6));
        const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
        try {
          await partyApi({ action: "create", code, slug: movie.slug.trim(), source: movie.source, name: movie.name.trim(), poster: movie.poster, ep: movie.ep, srv: movie.srv });
          return code;
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("duplicate key")) throw error;
        }
      }
      throw new Error("Không tạo được mã phòng");
    },
  });
}

/** Phòng xem chung, tự cập nhật realtime */
export function useParty(code: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["party", code],
    queryFn: async () => {
      return partyApi({ action: "join", code: code.trim().toUpperCase() });
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
    await partyApi({ action: "sync", partyId: party.id, patch });
  };
}

/** Chủ phòng đóng phòng xem chung */
export function useCloseParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (party: Party) => {
      await partyApi({ action: "close", partyId: party.id });
      return party.code;
    },
    onSuccess: (code) => qc.invalidateQueries({ queryKey: ["party", code] }),
  });
}


export function usePartyChat(partyId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [typingKey] = useState(() => Math.random().toString(36).slice(2));
  const [incomingMessage, setIncomingMessage] = useState<PartyMessage | null>(null);

  const query = useQuery({
    queryKey: ["party-chat", partyId],
    enabled: !!partyId,
    refetchInterval: 2000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/watch-party", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ action: "chat-list", partyId }) });
      const result = (await response.json()) as { messages?: PartyMessage[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Không tải được chat");
      return result.messages ?? [];
    },
  });

  useEffect(() => {
    if (!partyId) return;
    const channel = supabase
      .channel(`party-chat-${partyId}-${typingKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "watch_party_messages", filter: `party_id=eq.${partyId}` },
        (payload) => {
          const message = payload.new as PartyMessage;
          qc.setQueryData(["party-chat", partyId], (old: PartyMessage[] | undefined) => [
            ...(old ?? []).filter((m) => m.id !== message.id),
            message,
          ]);
          if (message.user_id !== user?.id) setIncomingMessage(message);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [partyId, qc, typingKey, user?.id]);

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
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      await partyApi({ action: "chat-send", partyId, displayName: meta.display_name || meta.full_name || user.email?.split("@")[0] || "Khán giả", content });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["party-chat", partyId] }),
  });

  return { ...query, send, incomingMessage, dismissIncoming: () => setIncomingMessage(null) };
}

/** Số người đang trong phòng (presence) */
type StaffPresence = { id: string; name: string; role: StaffRole; at: number };

export function usePartyPresence(code: string, name: string) {
  const { user } = useAuth();
  const [count, setCount] = useState(1);
  const [staffNotice, setStaffNotice] = useState<StaffPresence | null>(null);
  const [joinedNotice, setJoinedNotice] = useState<StaffPresence | null>(null);
  useEffect(() => {
    const role = staffRole(user);
    const id = user?.id ?? `guest-${name}`;
    const label = staffLabel(role, name);
    const channel = supabase.channel(`party-presence-${code}`, { config: { presence: { key: id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length || 1);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const joined = (newPresences as unknown as StaffPresence[]).find((presence) => presence.id !== id);
        if (joined) {
          setJoinedNotice(joined);
          if (isStaff(joined.role)) setStaffNotice(joined);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ id, name: label, role, at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code, name, user?.id, user?.email, user?.app_metadata?.role]);
  return { count, joinedNotice, setJoinedNotice, staffNotice, setStaffNotice };
}
