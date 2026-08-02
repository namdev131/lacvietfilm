import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchDetail } from "@/lib/api";

export default defineTool({
  name: "get_movie",
  title: "Chi tiết phim",
  description: "Get details for one movie (description, genres, episode servers) by slug and source.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Movie slug, as returned by search_movies."),
    source: z.enum(["kkphim", "ophim", "nguonc"]).default("kkphim"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ slug, source }) => {
    const m = await fetchDetail(slug, source);
    const movie = {
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      year: m.year,
      quality: m.quality,
      lang: m.lang,
      time: m.time,
      episode_current: m.episode_current,
      category: m.category,
      country: m.country,
      actors: m.actors,
      director: m.director,
      content: m.content,
      servers: m.servers.map((s) => ({ server_name: s.server_name, episodes: s.items.length })),
      source: m.source,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(movie, null, 2) }],
      structuredContent: { movie },
    };
  },
});
