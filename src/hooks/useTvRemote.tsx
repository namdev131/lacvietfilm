import { useEffect, useState } from "react";
import { TIZEN_KEYCODE, exitTvApp } from "@/lib/tizen";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.hasAttribute("data-tv-skip")) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.05;
  });
}

type Dir = "up" | "down" | "left" | "right";

function pickNext(current: HTMLElement | null, dir: Dir): HTMLElement | null {
  const items = visibleFocusables();
  if (!items.length) return null;
  if (!current) return items[0];

  const c = current.getBoundingClientRect();
  const cx = c.left + c.width / 2;
  const cy = c.top + c.height / 2;

  let best: { el: HTMLElement; score: number } | null = null;
  for (const el of items) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    const forward =
      dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
    if (forward <= 8) continue;

    const lateral = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
    // ưu tiên cùng hàng/cột: phạt nặng độ lệch ngang/dọc
    const score = forward + lateral * 3;
    if (!best || score < best.score) best = { el, score };
  }
  return best?.el ?? null;
}

function isTypingTarget(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable;
}

/** Điều khiển toàn app bằng remote Smart TV / bàn phím (D-pad, OK, Back, phím media). */
export function useTvRemote() {
  const [tvMode, setTvMode] = useState(false);

  useEffect(() => {
    const onKey = (rawEvent: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      // Remote Samsung (Tizen) gửi keyCode riêng, không có e.key chuẩn
      const mapped = TIZEN_KEYCODE[rawEvent.keyCode];
      const e =
        mapped && (!rawEvent.key || rawEvent.key === "Unidentified" || rawEvent.key !== mapped)
          ? (new Proxy(rawEvent, {
              get(t, prop) {
                if (prop === "key") return mapped;
                const v = Reflect.get(t, prop);
                return typeof v === "function" ? v.bind(t) : v;
              },
            }) as KeyboardEvent)
          : rawEvent;

      // Phím media (remote)
      if (e.key === "MediaPlayPause" || e.key === "MediaPlay" || e.key === "MediaPause") {
        const v = document.querySelector("video");
        if (v) {
          e.preventDefault();
          v.paused ? void v.play() : v.pause();
        }
        return;
      }
      if (e.key === "MediaFastForward" || e.key === "MediaTrackNext") {
        const v = document.querySelector("video");
        if (v) { e.preventDefault(); v.currentTime += 30; }
        return;
      }
      if (e.key === "MediaRewind" || e.key === "MediaTrackPrevious") {
        const v = document.querySelector("video");
        if (v) { e.preventDefault(); v.currentTime -= 30; }
        return;
      }

      // Phím màu trên remote: lối tắt điều hướng nhanh
      const colorRoutes: Record<string, string> = {
        ColorF0Red: "/search",
        ColorF1Green: "/favorites",
        ColorF2Yellow: "/history",
        ColorF3Blue: "/settings",
      };
      const colorTarget = colorRoutes[e.key];
      if (colorTarget && !isTypingTarget(active)) {
        e.preventDefault();
        window.location.assign(colorTarget);
        return;
      }

      // Nút Back / Exit trên remote (một số TV gửi keyCode 461 / 10009 / "GoBack")
      if (
        (e.key === "GoBack" || e.key === "Exit" || (e as KeyboardEvent).keyCode === 461) &&
        !isTypingTarget(active)
      ) {
        e.preventDefault();
        const atRoot = window.location.pathname === "/";
        if (e.key === "Exit" || atRoot) {
          if (exitTvApp()) return;
        }
        if (atRoot) return;
        window.history.back();
        return;
      }


      if (isTypingTarget(active)) return;

      const dirs: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = dirs[e.key];
      if (dir) {
        // Nếu đang focus vào video, mũi tên trái/phải để tua
        if (active?.tagName === "VIDEO" && (dir === "left" || dir === "right")) return;
        const next = pickNext(active && active !== document.body ? active : null, dir);
        if (next) {
          e.preventDefault();
          setTvMode(true);
          document.documentElement.classList.add("tv-mode");
          next.focus({ preventScroll: true });
          next.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        }
        return;
      }

      if (e.key === "Enter" && active && active !== document.body) {
        setTvMode(true);
        document.documentElement.classList.add("tv-mode");
      }
    };

    const onPointer = () => {
      setTvMode(false);
      document.documentElement.classList.remove("tv-mode");
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return tvMode;
}

export function TvRemote() {
  useTvRemote();
  return null;
}
