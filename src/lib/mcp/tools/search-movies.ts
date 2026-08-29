import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { searchMovies } from "@/lib/api";

export default defineTool({
  name: "search_movies",
  title: "Tìm phim",
  description: "Search the Lạc Việt Film catalog by keyword across a movie source.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Keyword, e.g. a movie title."),
    source: z
      .enum(["kkphim", "ophim", "nguonc"])
      .default("kkphim")
      .describe("Catalog source to search."),
    limit: z.number().int().min(1).max(20).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, source, limit }) => {
    const results = (await searchMovies(query, source)).slice(0, limit).map((m) => ({
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      year: m.year,
      quality: m.quality,
      source: m.source,
      poster: m.poster,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
