import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/Player.tsx", import.meta.url), "utf8");

assert.match(source, /\.lock\?\.\("landscape"\)/, "mobile fullscreen must request landscape orientation");
assert.match(source, /onClick=\{togglePlayerControls\}/, "tapping the player must toggle player controls");
assert.match(source, /setControlsVisible\(\(visible\) => \{[\s\S]*?return !visible;[\s\S]*?\}\)/, "a second tap must hide player controls");
const videoTag = source.match(/<video[\s\S]*?\/>/)?.[0] ?? "";
assert.doesNotMatch(videoTag, /onClick=\{togglePlay\}/, "tapping the video must not toggle playback");
assert.match(source, /fullscreenchange/, "fullscreen state must drive controls and orientation");
assert.match(source, /onTouchStart=\{beginTouchGesture\}/, "player must start touch gestures");
assert.match(source, /onTouchMove=\{updateTouchGesture\}/, "player must update volume or brightness while swiping");
assert.match(source, /onDoubleClick=\{handleDoubleTap\}/, "double tap must seek by screen side");
assert.match(source, /seekBy\(event\.clientX < rect\.left \+ rect\.width \/ 2 \? -10 : 10\)/, "left must rewind and right must fast-forward 10 seconds");
assert.match(source, /style=\{\{ filter: `brightness\(\$\{brightness\}\)` \}\}/, "left swipe brightness must affect video");

console.log("Player mobile fullscreen contract passed");
