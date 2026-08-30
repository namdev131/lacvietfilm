/* Lạc Việt Film — service worker
   - Điều hướng: network-first, có trang offline dự phòng
   - Ảnh poster: cache-first (dùng lại khi mạng yếu / offline)
   - Tài nguyên tĩnh: stale-while-revalidate
   Không bao giờ cache video (m3u8/ts/mp4) hay lời gọi API. */
const VERSION = "lv-v2";
const SHELL = `${VERSION}-shell`;
const IMAGES = `${VERSION}-img`;
const MAX_IMAGES = 300;

const OFFLINE_HTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ngoại tuyến — Lạc Việt Film</title>
<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#fafafa;font-family:system-ui,-apple-system,"Be Vietnam Pro",sans-serif;text-align:center}
h1{font-size:20px;margin:0 0 8px}p{color:#a1a1aa;font-size:14px;margin:0 0 20px}
button{background:#E50914;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:600;font-size:14px}</style></head>
<body><div><h1>Bạn đang ngoại tuyến</h1><p>Không có kết nối mạng. Hãy thử lại khi mạng ổn định.</p>
<button onclick="location.reload()">Thử lại</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) =>
      c.put("/__offline", new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

const isImage = (req, url) =>
  req.destination === "image" || /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(url.pathname);

const isStatic = (req) =>
  ["style", "script", "font"].includes(req.destination);

const isMedia = (url) => /\.(m3u8|ts|mp4|m4s|mpd|vtt|srt)(\?|$)/i.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;
  if (isMedia(url)) return;
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match("/__offline")) || Response.error()),
    );
    return;
  }

  if (isImage(req, url)) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && (res.ok || res.type === "opaque")) {
            void cache.put(req, res.clone()).then(() => trimCache(IMAGES, MAX_IMAGES));
          }
          return res;
        } catch {
          return hit || Response.error();
        }
      }),
    );
    return;
  }

  if (isStatic(req) && url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) void cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit || Response.error());
        return hit || network;
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "lv-clear-cache") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});
