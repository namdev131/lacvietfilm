import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2, CalendarDays, Clock3, ExternalLink, MapPin, Phone, Play, Search, Star } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import {
  absoluteCinemaUrl,
  fetchCinemaCatalog,
  joinCinemaShowtimes,
  parseJsonArray,
  type CinemaMovie,
  type CinemaVenue,
} from "@/lib/cinema-api";

export const Route = createFileRoute("/cinema")({
  head: () => ({ meta: [{ title: "Rạp Chiếu Phim — Lạc Việt Film" }] }),
  component: CinemaPage,
});

type Tab = "movies" | "showtimes" | "cinemas";
const TABS: { id: Tab; label: string; icon: typeof Play }[] = [
  { id: "movies", label: "Phim đang chiếu", icon: Play },
  { id: "showtimes", label: "Lịch chiếu", icon: CalendarDays },
  { id: "cinemas", label: "Hệ thống rạp", icon: Building2 },
];
const norm = (value?: string | null) => (value || "").toLocaleLowerCase("vi-VN");

function CinemaPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cinema-catalog"],
    queryFn: fetchCinemaCatalog,
    enabled: typeof window !== "undefined",
    staleTime: 15 * 60_000,
  });
  const [tab, setTab] = useState<Tab>("movies");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [date, setDate] = useState("");
  const [movie, setMovie] = useState<CinemaMovie | null>(null);
  const [cinema, setCinema] = useState<CinemaVenue | null>(null);

  const joined = useMemo(() => data ? joinCinemaShowtimes(data) : [], [data]);
  const dates = useMemo(() => [...new Set(joined.map((item) => item.date))].sort().reverse(), [joined]);
  const today = new Date().toLocaleDateString("sv-SE");
  const selectedDate = date || (dates.includes(today) ? today : dates[0]) || "";
  const cities = useMemo(() => [...new Set((data?.cinemas || []).map((item) => item.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "vi")), [data]);
  const q = norm(query.trim());
  const schedule = joined.filter((item) => item.date === selectedDate && (city === "all" || item.cinema?.city === city) && (!q || norm(`${item.movie?.name} ${item.movie?.en_name} ${item.cinema?.name} ${item.cinema?.address}`).includes(q)));
  const currentMovies = [...new Map(schedule.filter((item) => item.movie).map((item) => [item.movie_id, item.movie!])).values()];
  const visibleCinemas = (data?.cinemas || []).filter((item) => (city === "all" || item.city === city) && (!q || norm(`${item.name} ${item.address} ${item.city}`).includes(q)));

  if (isLoading) return <CinemaLoading />;
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-black">Rạp Chiếu Phim</h1><p className="mt-3 text-destructive">Không tải được dữ liệu rạp. Vui lòng thử lại.</p></div>;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 md:px-10 md:py-10">
      <header className="overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-primary">Lịch chiếu toàn quốc</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Rạp Chiếu Phim</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">Tra cứu phim, suất chiếu, cụm rạp, địa chỉ, giá vé và thông tin rạp tại một nơi.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_190px]">
          <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phim hoặc rạp" className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
          <select aria-label="Chọn thành phố" value={city} onChange={(event) => setCity(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="all">Chọn thành phố · Tất cả</option>{cities.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Chọn ngày" value={selectedDate} onChange={(event) => setDate(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="">Chọn ngày</option>{dates.map((value) => <option key={value}>{value}</option>)}</select>
        </div>
      </header>

      <nav className="mt-5 grid grid-cols-3 gap-2" aria-label="Nội dung rạp chiếu phim">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-bold md:text-sm ${tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      <div className="mt-6">
        {tab === "movies" && <MovieGrid movies={currentMovies} onSelect={setMovie} />}
        {tab === "showtimes" && <ShowtimeList items={schedule} onMovie={setMovie} onCinema={setCinema} />}
        {tab === "cinemas" && <CinemaGrid cinemas={visibleCinemas} onSelect={setCinema} />}
      </div>

      {(movie || cinema) && <DetailPanel movie={movie} cinema={cinema} onClose={() => { setMovie(null); setCinema(null); }} />}
    </div>
  );
}

function MovieGrid({ movies, onSelect }: { movies: CinemaMovie[]; onSelect: (movie: CinemaMovie) => void }) {
  if (!movies.length) return <Empty text="Không có phim phù hợp trong ngày đã chọn." />;
  return <section><h2 className="mb-4 text-xl font-black">Phim đang chiếu <span className="text-sm font-medium text-muted-foreground">({movies.length})</span></h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{movies.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className="group overflow-hidden rounded-2xl border border-border bg-card text-left"><div className="aspect-[2/3] overflow-hidden bg-muted"><img src={absoluteCinemaUrl(item.poster)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{item.duration || item.year || "Đang chiếu"}</p></div></button>)}</div></section>;
}

function ShowtimeList({ items, onMovie, onCinema }: { items: ReturnType<typeof joinCinemaShowtimes>; onMovie: (movie: CinemaMovie) => void; onCinema: (cinema: CinemaVenue) => void }) {
  const groups = [...new Map(items.map((item) => [item.cinema_id, { cinema: item.cinema, rows: items.filter((row) => row.cinema_id === item.cinema_id) }])).values()];
  if (!groups.length) return <Empty text="Không tìm thấy lịch chiếu phù hợp." />;
  return <section><h2 className="mb-4 text-xl font-black">Lịch chiếu</h2><div className="space-y-4">{groups.map(({ cinema, rows }) => <article key={rows[0].cinema_id} className="rounded-2xl border border-border bg-card p-4 md:p-5"><button type="button" onClick={() => cinema && onCinema(cinema)} className="text-left"><h3 className="font-black hover:text-primary">{cinema?.name || `Rạp #${rows[0].cinema_id}`}</h3><p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{cinema?.address || cinema?.city}</p></button><div className="mt-4 space-y-4">{rows.map((row) => <div key={row.id} className="grid gap-2 border-t border-border/60 pt-3 md:grid-cols-[220px_1fr]"><button type="button" onClick={() => row.movie && onMovie(row.movie)} className="text-left text-sm font-bold hover:text-primary">{row.movie?.name || `Phim #${row.movie_id}`}</button><div className="space-y-2">{row.screens.map((screen, index) => <div key={`${row.id}-${index}`}><p className="mb-1 text-[11px] font-semibold text-muted-foreground">{screen.screen.trim() || "Suất chiếu"}</p><div className="flex flex-wrap gap-2">{screen.times.map((time) => <span key={time} className="rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"><Clock3 className="mr-1 inline h-3 w-3" />{time}</span>)}</div></div>)}</div></div>)}</div></article>)}</div></section>;
}

function CinemaGrid({ cinemas, onSelect }: { cinemas: CinemaVenue[]; onSelect: (cinema: CinemaVenue) => void }) {
  if (!cinemas.length) return <Empty text="Không tìm thấy rạp phù hợp." />;
  return <section><h2 className="mb-4 text-xl font-black">Hệ thống rạp <span className="text-sm font-medium text-muted-foreground">({cinemas.length})</span></h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{cinemas.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-primary"><div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">{item.image ? <img src={absoluteCinemaUrl(item.image)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Building2 className="m-auto mt-8 h-7 w-7 text-muted-foreground" />}</div><div className="min-w-0"><h3 className="line-clamp-2 font-black">{item.name}</h3><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.address || item.city || "Đang cập nhật địa chỉ"}</p>{item.phone && <p className="mt-2 text-xs text-primary"><Phone className="mr-1 inline h-3 w-3" />{item.phone}</p>}</div></button>)}</div></section>;
}

function DetailPanel({ movie, cinema, onClose }: { movie: CinemaMovie | null; cinema: CinemaVenue | null; onClose: () => void }) {
  const item = movie || cinema!;
  const gallery = parseJsonArray<string>(movie?.gallery || cinema?.gallery).map(absoluteCinemaUrl);
  const html = DOMPurify.sanitize(movie?.description || movie?.review_content || cinema?.description || "");
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true" aria-label={item.name} onClick={onClose}><article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-background" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-border p-4"><h2 className="text-xl font-black">{item.name}</h2><button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-1 text-sm">Đóng</button></div><div className="grid gap-5 p-4 md:grid-cols-[240px_1fr] md:p-6"><div>{(movie?.poster || cinema?.image) && <img src={absoluteCinemaUrl(movie?.poster || cinema?.image)} alt={item.name} className="w-full rounded-xl object-cover" />}{gallery.length > 0 && <div className="mt-2 grid grid-cols-3 gap-2">{gallery.slice(0, 6).map((url) => <img key={url} src={url} alt="" className="aspect-square rounded-lg object-cover" />)}</div>}</div><div><p className="text-sm text-muted-foreground">{movie ? [movie.en_name, movie.year, movie.duration, movie.country, movie.age_restricted, movie.technology].filter(Boolean).join(" · ") : [cinema?.city, cinema?.address].filter(Boolean).join(" · ")}</p>{movie?.imdb && <p className="mt-3 text-sm"><Star className="mr-1 inline h-4 w-4 text-primary" />IMDb {movie.imdb}</p>}{cinema?.phone && <p className="mt-3 text-sm"><Phone className="mr-1 inline h-4 w-4" />{cinema.phone}</p>}<div className="mt-4 flex flex-wrap gap-2">{movie?.trailer && <a href={absoluteCinemaUrl(movie.trailer)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Play className="mr-1 inline h-4 w-4" />Trailer</a>}{cinema?.geo_lat && cinema?.geo_long && <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${cinema.geo_lat},${cinema.geo_long}`)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-bold"><MapPin className="mr-1 inline h-4 w-4" />Bản đồ</a>}{cinema?.source_link && <a href={cinema.source_link} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-bold"><ExternalLink className="mr-1 inline h-4 w-4" />Trang rạp</a>}</div>{html && <div className="mt-5 max-h-80 overflow-y-auto text-sm leading-7 text-muted-foreground [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: html }} />}{cinema?.price && <details className="mt-5"><summary className="cursor-pointer font-bold text-primary">Bảng giá vé</summary><div className="mt-3 max-h-80 overflow-auto text-xs [&_img]:max-w-full [&_table]:min-w-[600px]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cinema.price) }} /></details>}</div></div></article></div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{text}</div>; }
function CinemaLoading() { return <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-10"><div className="h-56 animate-pulse rounded-3xl bg-card" /><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl bg-card" />)}</div></div>; }
