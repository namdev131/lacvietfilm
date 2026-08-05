/**
 * Hỗ trợ trình duyệt Internet của Samsung Smart TV (Tizen OS).
 * - Nhận diện thiết bị Tizen / Smart TV
 * - Đăng ký các phím remote (media, back, màu) qua tizen.tvinputdevice
 * - Vá (polyfill) vài API JS mà bản Chromium cũ trên Tizen còn thiếu
 * - Bật chế độ TV: focus ring, vùng an toàn (overscan)
 */

type TizenInputDevice = {
  getSupportedKeys?: () => { name: string }[];
  registerKey?: (name: string) => void;
};

type TizenGlobal = typeof globalThis & {
  tizen?: { tvinputdevice?: TizenInputDevice };
};

/** Các phím remote Samsung cần đăng ký để web nhận được sự kiện */
const TIZEN_KEYS = [
  "MediaPlay",
  "MediaPause",
  "MediaPlayPause",
  "MediaStop",
  "MediaRewind",
  "MediaFastForward",
  "MediaTrackPrevious",
  "MediaTrackNext",
  "ColorF0Red",
  "ColorF1Green",
  "ColorF2Yellow",
  "ColorF3Blue",
  "ChannelUp",
  "ChannelDown",
  "Exit",
  "Info",
];

/** Mã phím riêng của remote Samsung (Tizen) → tên phím chuẩn */
export const TIZEN_KEYCODE: Record<number, string> = {
  10009: "GoBack", // RETURN
  10182: "Exit",
  10252: "MediaPlayPause",
  415: "MediaPlay",
  19: "MediaPause",
  413: "MediaStop",
  412: "MediaRewind",
  417: "MediaFastForward",
  427: "ChannelUp",
  428: "ChannelDown",
  403: "ColorF0Red",
  404: "ColorF1Green",
  405: "ColorF2Yellow",
  406: "ColorF3Blue",
  457: "Info",
  13: "Enter",
};

export function isTizen(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Tizen|SMART-TV|SmartTV|Web0S|WebOS|HbbTV|NetCast|BRAVIA|AFT[A-Z]/i.test(ua);
}

/** Vá các API thiếu trên Chromium cũ của Tizen (2017–2020) */
function polyfills() {
  const anyArray = Array.prototype as unknown as Record<string, unknown>;
  if (typeof anyArray["at"] !== "function") {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, "at", {
      value: function (this: unknown[], n: number) {
        const i = Math.trunc(n) || 0;
        return this[i < 0 ? this.length + i : i];
      },
      writable: true,
      configurable: true,
    });
  }
  const anyString = String.prototype as unknown as Record<string, unknown>;
  if (typeof anyString["replaceAll"] !== "function") {
    Object.defineProperty(String.prototype, "replaceAll", {
      value: function (this: string, search: string | RegExp, replace: string) {
        if (search instanceof RegExp) return this.replace(search, replace);
        return this.split(search).join(replace);
      },
      writable: true,
      configurable: true,
    });
  }
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g["structuredClone"] !== "function") {
    g["structuredClone"] = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown;
  }
  if (typeof g["requestIdleCallback"] !== "function") {
    g["requestIdleCallback"] = (cb: (d: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
      setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 8 }), 1) as unknown as number;
    g["cancelIdleCallback"] = (id: number) => clearTimeout(id);
  }
  if (typeof Object.hasOwn !== "function") {
    Object.defineProperty(Object, "hasOwn", {
      value: (o: object, k: PropertyKey) => Object.prototype.hasOwnProperty.call(o, k),
      writable: true,
      configurable: true,
    });
  }
}

let inited = false;

/** Gọi 1 lần khi app khởi động (chỉ chạy phía trình duyệt). */
export function initTvPlatform() {
  if (inited || typeof window === "undefined") return;
  inited = true;

  polyfills();

  if (!isTizen()) return;

  const root = document.documentElement;
  root.classList.add("tizen-tv", "tv-mode");

  // Đăng ký phím remote Samsung
  const dev = (globalThis as TizenGlobal).tizen?.tvinputdevice;
  if (dev?.registerKey) {
    for (const key of TIZEN_KEYS) {
      try {
        dev.registerKey(key);
      } catch {
        /* phím không được hỗ trợ trên model này */
      }
    }
  }

  // TV không có chuột: luôn hiện focus ring và tắt hover-only
  document.body.classList.add("no-hover");
}
