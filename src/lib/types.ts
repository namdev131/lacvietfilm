export type SourceId = "kkphim" | "ophim" | "nguonc";

export interface MovieCard {
  slug: string;
  name: string;
  origin_name?: string;
  poster: string;
  thumb: string;
  year?: number | string;
  quality?: string;
  lang?: string;
  episode_current?: string;
  source: SourceId;
}

export interface EpisodeServerItem {
  name: string; // e.g. "Tập 1"
  slug: string;
  m3u8?: string;
  embed?: string;
}

export interface EpisodeServer {
  server_name: string; // e.g. "Vietsub #1", "Thuyết Minh"
  items: EpisodeServerItem[];
}

export interface MovieDetail {
  slug: string;
  name: string;
  origin_name?: string;
  poster: string;
  thumb: string;
  content?: string;
  year?: number | string;
  quality?: string;
  lang?: string;
  episode_current?: string;
  time?: string;
  category?: string[];
  country?: string[];
  actors?: string[];
  director?: string[];
  servers: EpisodeServer[];
  source: SourceId;
}
