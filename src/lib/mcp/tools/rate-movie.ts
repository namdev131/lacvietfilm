import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "rate_movie",
  title: "Đánh giá phim",
  description: "Set the signed-in user's 1–5 star rating for a movie.",
  inputSchema: {
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    source: z.enum(["kkphim", "ophim", "nguonc", "vsmov"]).default("kkphim"),
    score: z.number().int().min(1).max(5),
    poster: z.string().url().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ slug, name, source, score, poster }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("movie_ratings")
      .upsert(
        { user_id: ctx.getUserId(), slug, source, name, score, poster: poster ?? null },
        { onConflict: "user_id,slug" },
      )
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Đã chấm ${score}/5 cho "${name}".` }],
      structuredContent: { rating: data },
    };
  },
});
