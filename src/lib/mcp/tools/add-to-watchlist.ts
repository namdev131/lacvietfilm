import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_to_watchlist",
  title: "Thêm vào Xem sau",
  description: "Add a movie to the signed-in user's watch-later list.",
  inputSchema: {
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1).describe("Movie title to display."),
    source: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
    poster: z.string().url().optional(),
    note: z.string().trim().max(500).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ slug, name, source, poster, note }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("watchlist")
      .insert({ user_id: ctx.getUserId(), slug, name, source, poster: poster ?? null, note: note ?? null })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Đã thêm "${name}" vào Xem sau.` }],
      structuredContent: { item: data },
    };
  },
});
