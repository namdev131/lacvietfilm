import assert from "node:assert/strict";
import { beginNextEpisode, tickNextEpisode, cancelNextEpisode } from "../src/lib/nextEpisode.ts";
import { readFileSync } from "node:fs";

assert.deepEqual(beginNextEpisode(true, true), { status: "counting", seconds: 10 });
assert.deepEqual(beginNextEpisode(true, false), { status: "manual", seconds: 10 });
assert.deepEqual(beginNextEpisode(false, true), { status: "idle", seconds: 10 });
assert.deepEqual(tickNextEpisode({ status: "counting", seconds: 10 }), { status: "counting", seconds: 9 });
assert.deepEqual(tickNextEpisode({ status: "counting", seconds: 1 }), { status: "ready", seconds: 0 });
assert.deepEqual(cancelNextEpisode(), { status: "cancelled", seconds: 10 });

const player = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");
const watch = readFileSync(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8");
assert.ok(player.includes("Chuyển ngay"), "Thiếu nút chuyển tập thủ công");
assert.ok(player.includes("Ở lại tập này"), "Thiếu nút hủy đếm ngược");
assert.ok(player.includes("next-episode-overlay"), "Thiếu overlay tập tiếp theo");
assert.ok(player.includes("player-frame"), "Thiếu hook giao diện player mới");
assert.ok(!watch.includes("onEnded: () =>"), "Trang xem còn tự chuyển ngay khi ended");
console.log("player next episode contract: PASS");
