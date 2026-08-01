import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SourceId } from "@/lib/types";

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover: string | null;
  is_public: boolean;
  share_code: string;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  slug: string;
  name: string;
  poster: string | null;
  source: string;
  note: string | null;
  position: number;
}

export function useMyCollections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collections", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,user_id,title,description,cover,is_public,share_code,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Collection[];
    },
  });
}

export function useCollection(idOrCode: string, by: "id" | "share_code" = "id") {
  return useQuery({
    queryKey: ["collection", by, idOrCode],
    enabled: !!idOrCode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,user_id,title,description,cover,is_public,share_code,created_at")
        .eq(by, idOrCode)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: items, error: e2 } = await supabase
        .from("collection_items")
        .select("id,collection_id,slug,name,poster,source,note,position")
        .eq("collection_id", data.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (e2) throw e2;
      return { collection: data as Collection, items: (items ?? []) as CollectionItem[] };
    },
  });
}

export function useCreateCollection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { title: string; description?: string; is_public?: boolean }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      const { data, error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          title: v.title.trim(),
          description: v.description?.trim() || null,
          is_public: v.is_public ?? false,
        })
        .select("id,share_code")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; title?: string; description?: string | null; is_public?: boolean }) => {
      const { id, ...patch } = v;
      const { error } = await supabase.from("collections").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useAddToCollection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      collectionId: string;
      slug: string;
      name: string;
      poster?: string;
      source: SourceId;
    }) => {
      if (!user) throw new Error("Bạn cần đăng nhập");
      const { error } = await supabase.from("collection_items").upsert(
        {
          collection_id: v.collectionId,
          user_id: user.id,
          slug: v.slug,
          name: v.name,
          poster: v.poster ?? null,
          source: v.source,
        },
        { onConflict: "collection_id,slug" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useRemoveCollectionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collection_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection"] }),
  });
}
