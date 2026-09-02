export const CINEMA_API_BASE = "https://rapchieuphim.com/api/v1";
export const CINEMA_SITE_ORIGIN = "https://rapchieuphim.com";

export interface CinemaMovie {
  id: number;
  name: string;
  slug: string;
  en_name?: string | null;
  poster?: string | null;
  trailer?: string | null;
  description?: string | null;
  review_content?: string | null;
  release?: string | null;
  release_vn?: string | null;
  production_co?: string | null;
  country?: string | null;
  duration?: string | null;
  imdb?: string | null;
  imdb_link?: string | null;
  year?: string | null;
  status?: string | null;
  age_restricted?: string | null;
  technology?: string | null;
  gallery?: string | null;
  hot?: number | null;
  star_rating_value?: number | null;
  star_rating_count?: number | null;
}

export interface CinemaVenue {
  id: number;
  name: string;
  slug: string;
  status?: string | null;
  image?: string | null;
  gallery?: string | null;
  city?: string | null;
  address?: string | null;
  parent?: number | null;
  geo_lat?: string | null;
  geo_long?: string | null;
  description?: string | null;
  price?: string | null;
  phone?: string | null;
  source_link?: string | null;
  showtime_link?: string | null;
}

export interface CinemaScreen {
  screen: string;
  times: string[];
}

export interface CinemaShowtime {
  id: number;
  movie_id: number;
  cinema_id: number;
  technology_id?: number | null;
  date: string;
  time?: string | null;
  screens: CinemaScreen[];
}

export interface CinemaCatalog {
  movies: CinemaMovie[];
  cinemas: CinemaVenue[];
  showtimes: CinemaShowtime[];
}

export interface JoinedCinemaShowtime extends CinemaShowtime {
  movie?: CinemaMovie;
  cinema?: CinemaVenue;
}

let catalogPromise: Promise<CinemaCatalog> | null = null;

async function getJson<T>(endpoint: "/movies" | "/cinemas" | "/showtimes"): Promise<T> {
  const response = await fetch(`${CINEMA_API_BASE}${endpoint}`);
  if (!response.ok) throw new Error(`Rạp Chiếu Phim API ${response.status}: ${endpoint}`);
  return response.json() as Promise<T>;
}

export function parseJsonArray<T>(value?: string | null): T[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function absoluteCinemaUrl(value?: string | null): string {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, CINEMA_SITE_ORIGIN).href;
}

export async function fetchCinemaCatalog(): Promise<CinemaCatalog> {
  return (catalogPromise ??= Promise.all([
    getJson<CinemaMovie[]>("/movies"),
    getJson<CinemaVenue[]>("/cinemas"),
    getJson<Omit<CinemaShowtime, "screens">[]>("/showtimes"),
  ]).then(([movies, cinemas, showtimes]) => ({
    movies,
    cinemas,
    showtimes: showtimes.map((showtime) => ({
      ...showtime,
      screens: parseJsonArray<CinemaScreen>(showtime.time),
    })),
  })).catch((error) => {
    catalogPromise = null;
    throw error;
  }));
}

export function joinCinemaShowtimes(catalog: CinemaCatalog): JoinedCinemaShowtime[] {
  const movies = new Map(catalog.movies.map((movie) => [movie.id, movie]));
  const cinemas = new Map(catalog.cinemas.map((cinema) => [cinema.id, cinema]));
  return catalog.showtimes.map((showtime) => ({
    ...showtime,
    movie: movies.get(showtime.movie_id),
    cinema: cinemas.get(showtime.cinema_id),
  }));
}
