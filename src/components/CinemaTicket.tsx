import { Link } from "@tanstack/react-router";
import { Expand, Film, Ticket, UserRound } from "lucide-react";
import { createTicketCode } from "@/lib/tickets";
import type { SourceId } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CinemaTicket({
  slug,
  name,
  poster,
  source,
  userId,
  owner,
  episode,
  compact = false,
}: {
  slug: string;
  name: string;
  poster?: string | null;
  source: SourceId | string;
  userId?: string | null;
  owner: string;
  episode?: string | null;
  compact?: boolean;
}) {
  const code = createTicketCode({ userId, source, slug });
  const ticket = (detail = false) => (
    <article className={`cinema-ticket ${compact && !detail ? "cinema-ticket-compact" : ""} ${detail ? "ticket-detail-full" : ""}`} aria-label={`Vé xem phim ${name}`}>
      <div className="ticket-stub" aria-hidden="true">
        {poster ? <img src={poster} alt="" loading="lazy" /> : <Film className="h-6 w-6" />}
      </div>
      <div className="ticket-body">
        <div className="ticket-brand"><Ticket className="h-3.5 w-3.5" /> Lạc Việt Film</div>
        <h3 title={name}>{name}</h3>
        <div className="ticket-meta">
          <span><UserRound className="h-3.5 w-3.5" /> {owner}</span>
          {episode && <span>{episode}</span>}
        </div>
        <div className="ticket-code"><span>Mã vé</span><strong>{code}</strong></div>
      </div>
      <div className="ticket-admit">
        <span>{String(source).toUpperCase()}</span>
        <Link to="/movie/$slug" params={{ slug }} search={{ src: source as SourceId }} aria-label={`Mở ${name}`}>Vào rạp</Link>
      </div>
    </article>
  );
  return (
    <div className="ticket-with-detail">
      {ticket()}
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="ticket-detail-trigger" aria-label={`Xem chi tiết vé ${name}`}>
            <Expand className="h-3.5 w-3.5" /> Xem chi tiết vé
          </button>
        </DialogTrigger>
        <DialogContent className="ticket-dialog max-w-4xl border-0 bg-transparent p-3 shadow-none sm:p-6">
          <DialogTitle className="sr-only">Chi tiết vé phim {name}</DialogTitle>
          <DialogDescription className="sr-only">Vé xem phim đầy đủ gồm chủ vé, mã vé, nguồn và tập phim.</DialogDescription>
          <div className="ticket-dialog-stage">{ticket(true)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
