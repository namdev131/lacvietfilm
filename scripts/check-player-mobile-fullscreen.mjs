import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");

assert.match(source, /\.lock\?\.\("landscape"\)/, "mobile fullscreen must request landscape orientation");
assert.match(source, /onClick=\{showPlayerControls\}/, "tapping the player must show player controls");
const videoTag = source.match(/<video[\s\S]*?\/>/)?.[0] ?? "";
assert.doesNotMatch(videoTag, /onClick=\{togglePlay\}/, "tapping the video must not toggle playback");
assert.match(source, /fullscreenchange/, "fullscreen state must drive controls and orientation");

console.log("Player mobile fullscreen contract passed");
