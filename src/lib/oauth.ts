import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/**
 * Lovable's managed OAuth broker only works on Lovable-hosted domains
 * (*.lovable.app / *.lovableproject.com / custom domains connected in Lovable).
 * On self-hosted deployments (Vercel, Netlify, ...) we fall back to Supabase's
 * native OAuth flow so sign-in keeps working.
 */
export function isLovableHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h.endsWith(".lovable.app") || h.endsWith(".lovableproject.com") || h === "localhost" || h === "127.0.0.1";
}

export async function signInWithGoogle(redirectTo: string): Promise<{ error?: unknown; redirected?: boolean }> {
  if (isLovableHost()) {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectTo });
    return { error: result.error, redirected: result.redirected };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) return { error };
  return { redirected: true };
}
