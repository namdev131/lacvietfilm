import { useEffect, useState } from "react";
import { Download, CheckCircle2, WifiOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

type BipEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BipEvent | null = null;

/** Đăng ký service worker cho chế độ ngoại tuyến + cài đặt ứng dụng (PWA). */
export function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* bỏ qua nếu trình duyệt chặn */
    });
  });
}

export function useInstallPrompt() {
  const [available, setAvailable] = useState(!!deferred);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      deferred = e as BipEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      deferred = null;
      setAvailable(false);
      setInstalled(true);
    };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) {
      toast.info("Trình duyệt chưa sẵn sàng. Trên iPhone: Chia sẻ → Thêm vào Màn hình chính.");
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    deferred = null;
    setAvailable(false);
  };

  return { available, installed, install };
}

export function InstallAppCard() {
  const { available, installed, install } = useInstallPrompt();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const clearCache = async () => {
    navigator.serviceWorker?.controller?.postMessage("lv-clear-cache");
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    toast.success("Đã xoá bộ nhớ đệm ngoại tuyến");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {installed ? "Đã cài trên thiết bị này" : "Cài Lạc Việt Cinema như ứng dụng"}
          </p>
          <p className="text-xs text-muted-foreground">
            Mở nhanh từ màn hình chính, chạy toàn màn hình, xem lại poster & danh sách cả khi mạng yếu.
          </p>
        </div>
        {installed ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Đã cài
          </span>
        ) : (
          <button
            onClick={install}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" /> {available ? "Cài ứng dụng" : "Hướng dẫn cài"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            online ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-300"
          }`}
        >
          <WifiOff className="h-3.5 w-3.5" /> {online ? "Đang trực tuyến" : "Đang ngoại tuyến"}
        </span>
        <button
          onClick={clearCache}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:border-primary/60"
        >
          <Trash2 className="h-4 w-4" /> Xoá bộ nhớ đệm ngoại tuyến
        </button>
      </div>
    </div>
  );
}
