import assert from "node:assert/strict";
import { createTicketCode, ticketOwnerLabel, uniqueTickets } from "../src/lib/tickets.ts";

const first = createTicketCode({ userId: "user-123", source: "kkphim", slug: "mai-2024" });
const second = createTicketCode({ userId: "user-123", source: "kkphim", slug: "mai-2024" });
assert.equal(first, second, "Cùng người và phim phải có cùng mã vé");
assert.match(first, /^LV-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
assert.notEqual(first, createTicketCode({ userId: "user-456", source: "kkphim", slug: "mai-2024" }));
assert.equal(ticketOwnerLabel({ displayName: "Minh Anh", email: "a@b.vn" }), "Minh Anh");
assert.equal(ticketOwnerLabel({ email: "a@b.vn" }), "a");
assert.equal(ticketOwnerLabel(null), "Khách Lạc Việt");
assert.deepEqual(uniqueTickets([
  { slug: "mai", source: "kkphim", watched_at: "2026-08-29" },
  { slug: "mai", source: "kkphim", watched_at: "2026-08-30" },
  { slug: "mai", source: "ophim", watched_at: "2026-08-31" },
]).map((x) => `${x.source}:${x.slug}`), ["ophim:mai", "kkphim:mai"]);
console.log("cinema ticket contract: PASS");
