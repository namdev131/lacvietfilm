import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchMoviesTool from "./tools/search-movies";
import getMovieTool from "./tools/get-movie";
import listFavoritesTool from "./tools/list-favorites";
import listWatchlistTool from "./tools/list-watchlist";
import addToWatchlistTool from "./tools/add-to-watchlist";
import listWatchHistoryTool from "./tools/list-watch-history";
import rateMovieTool from "./tools/rate-movie";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "cinestream-hub",
  title: "CineStream Hub",
  version: "0.1.0",
  instructions:
    "Tools for Lạc Việt Film. Search the movie catalog, read movie details, and manage the signed-in user's favorites, watch-later list, watch history and ratings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchMoviesTool,
    getMovieTool,
    listFavoritesTool,
    listWatchlistTool,
    addToWatchlistTool,
    listWatchHistoryTool,
    rateMovieTool,
  ],
});
