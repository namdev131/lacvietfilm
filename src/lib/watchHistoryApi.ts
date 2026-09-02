import { supabase } from "@/integrations/supabase/client";

export async function watchHistoryApi(
  action: "list" | "record" | "progress" | "delete",
  payload: Record<string, unknown> = {},
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Bạn cần đăng nhập");
  const response = await fetch("/api/watch-history", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = (await response.json()) as { history?: unknown[]; error?: string };
  if (!response.ok) throw new Error(result.error || "Không đồng bộ được lịch sử xem");
  return result;
}

export function deleteHistoryItem(slug: string) {
  return watchHistoryApi("delete", { slug });
}
