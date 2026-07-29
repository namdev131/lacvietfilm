import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = /(^|\.)streamvsmov\.com$/i;

function proxied(url: string) {
  return `/api/public/vsmov-stream?u=${encodeURIComponent(url)}`;
}

/** Vị trí bắt đầu của luồng MPEG-TS trong buffer (sync 0x47 lặp mỗi 188 byte). */
function findTsStart(buf: Uint8Array): number {
  const limit = Math.min(buf.length - 377, 65536);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0x47 && buf[i + 188] === 0x47 && buf[i + 376] === 0x47) return i;
  }
  return -1;
}

/** Cắt bỏ phần header nguỵ trang ở đầu phân đoạn, giữ nguyên phần còn lại. */
function stripToTs(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  let head: Uint8Array = new Uint8Array(0);
  let done = false;
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (done) {
          controller.enqueue(chunk);
          return;
        }
        const merged = new Uint8Array(head.length + chunk.length);
        merged.set(head);
        merged.set(chunk, head.length);
        const at = findTsStart(merged);
        if (at >= 0) {
          done = true;
          head = new Uint8Array(0);
          controller.enqueue(merged.subarray(at));
        } else if (merged.length > 65536) {
          done = true;
          head = new Uint8Array(0);
          controller.enqueue(merged);
        } else {
          head = merged;
        }
      },
      flush(controller) {
        if (!done && head.length) controller.enqueue(head);
      },
    }),
  );
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

        const upstream = await fetch(parsed.toString(), {
          headers: {
            Referer: `${parsed.origin}/`,
            "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0",
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

        // Phân đoạn của VSMov được nguỵ trang thành .png: bỏ phần rác ở đầu
        // cho tới khi gặp sync byte của MPEG-TS (0x47, lặp mỗi 188 byte).
        const body = upstream.body ? stripToTs(upstream.body) : null;
        return new Response(body, {
          status: upstream.status,
          headers: {
            "content-type": "video/mp2t",
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=3600",
          },
        });

      },
    },
  },
});
