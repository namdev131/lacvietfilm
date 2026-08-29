export interface TicketIdentity {
  userId?: string | null;
  source: string;
  slug: string;
}

export function createTicketCode({ userId, source, slug }: TicketIdentity): string {
  const value = `${userId || "guest"}:${source}:${slug}`;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = (hash >>> 0).toString(36).toUpperCase().padStart(8, "0").slice(-8);
  return `LV-${code.slice(0, 4)}-${code.slice(4)}`;
}

export function ticketOwnerLabel(user: { displayName?: string | null; email?: string | null } | null): string {
  return user?.displayName?.trim() || user?.email?.split("@")[0] || "Khách Lạc Việt";
}

export function uniqueTickets<T extends { slug: string; source: string; watched_at?: string }>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => (b.watched_at || "").localeCompare(a.watched_at || ""));
  return sorted.filter((item, index) => sorted.findIndex((x) => x.slug === item.slug && x.source === item.source) === index);
}
