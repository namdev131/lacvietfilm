import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = /(^|\.)streamvsmov\.com$/i;

function proxied(url: string) {
  return `/api/public/vsmov-stream?u=${encodeURIComponent(url)}`;
}

/**
 * Proxy luồng HLS của VSMov: các file .ts/.png của họ không trả CORS nên
 * hls.js không đọc được trực tiếp từ trình duyệt.
 */
export const Route = createFileRoute("/api/public/vsmov-stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("u");
        if (!target) return new Response("Missing u", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Bad url", { status: 400 });
        }
        if (parsed.protocol !== "https:" || !ALLOWED.test(parsed.hostname)) {
          return new Response("Forbidden host", { status: 403 });
        }

        const range = request.headers.get("range");
        const upstream = await fetch(parsed.toString(), {
          headers: {
            Referer: `${parsed.origin}/`,
            "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
            ...(range ? { Range: range } : {}),
          },
        });

        const isPlaylist =
          parsed.pathname.endsWith(".m3u8") ||
          (upstream.headers.get("content-type") || "").includes("mpegurl");

        if (isPlaylist) {
          const text = await upstream.text();
          const body = text
            .split("\n")
            .map((line) => {
              const l = line.trim();
              if (!l || l.startsWith("#")) return line;
              const abs = new URL(l, parsed).toString();
              return proxied(abs);
            })
            .join("\n");
          return new Response(body, {
            status: upstream.status,
            headers: {
              "content-type": "application/vnd.apple.mpegurl",
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=60",
            },
          });
        }

        const headers = new Headers();
        for (const k of ["content-type", "content-length", "content-range", "accept-ranges"]) {
          const v = upstream.headers.get(k);
          if (v) headers.set(k, v);
        }
        headers.set("access-control-allow-origin", "*");
        headers.set("cache-control", "public, max-age=3600");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
