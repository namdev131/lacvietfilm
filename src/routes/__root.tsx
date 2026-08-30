import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Search, Sun, Moon, Monitor } from "lucide-react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { DockBar } from "@/components/DockBar";
import { NotificationBell } from "@/components/NotificationBell";
import { JoinPartyDialog } from "@/components/JoinPartyDialog";
import { QuickSearch, openQuickSearch } from "@/components/QuickSearch";
import { PlayerHostProvider } from "@/components/PlayerHost";
import { TvRemote } from "@/hooks/useTvRemote";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { registerPwa } from "@/components/InstallPrompt";
import { CreditBadge } from "@/components/CreditBadge";
import { Onboarding } from "@/components/Onboarding";
import { initTvPlatform } from "@/lib/tizen";
const LOGO = "https://files.catbox.moe/6ua430.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn muốn xem không tồn tại hoặc đã bị dời.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Về trang nhà
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  async function recoverClient() {
    setRecovering(true);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } finally {
      window.location.replace(`${window.location.pathname}${window.location.search}${window.location.search ? "&" : "?"}recover=${Date.now()}`);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Không tải được trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đã có lỗi xảy ra, vui lòng thử lại.</p>
        <p className="mt-2 break-words text-xs text-destructive" role="alert">{error.message || "Lỗi ứng dụng không xác định"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => void recoverClient()}
            disabled={recovering}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {recovering ? "Đang sửa…" : "Thử lại"}
          </button>
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Thử không xoá cache</button>
          <a href="/" className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
            Về trang nhà
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lạc Việt Film — Mở phim, chạm hồn Việt" },
      { name: "description", content: "Xem phim trực tuyến tổng hợp từ KKPhim, OPhim, NguonC. HLS & Embed, Vietsub và Thuyết Minh." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "Lạc Việt Film" },
      { property: "og:description", content: "Mở phim, chạm hồn Việt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: LOGO, type: "image/png" },
      { rel: "apple-touch-icon", href: "/pwa-icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border/60" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="site-header-inner mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:h-16 md:px-10">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="brand-lockup flex items-center gap-2">
            <span className="brand-seal"><img src={LOGO} alt="Lạc Việt Film" className="h-8 w-8 object-contain" /></span>
            <span className="brand-wordmark hidden text-sm font-bold tracking-wide sm:inline">
              LẠC VIỆT <span className="text-primary">FILM</span>
            </span>
          </Link>

        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={openQuickSearch}
            aria-label="Tìm phim nhanh"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:text-sm"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Tìm phim…</span>
            <kbd className="hidden rounded border border-border px-1 text-[10px] md:inline">Ctrl K</kbd>
          </button>
          <JoinPartyDialog />
          <NotificationBell />
        </div>
      </div>

    </header>
  );
}

function ThemeToggle() {
  const { settings, set } = useSettings();
  const next = settings.theme === "system" ? "light" : settings.theme === "light" ? "dark" : "system";
  const label = settings.theme === "system" ? "Theo sắc trời hệ thống" : settings.theme === "light" ? "Giấy dó sáng" : "Đêm sao";
  const Icon = settings.theme === "system" ? Monitor : settings.theme === "light" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => set("theme", next)}
      aria-label={`${label}. Bấm để đổi sắc trời`}
      title={label}
      className="theme-toggle"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Footer() {
  return (
    <footer className="site-footer mt-16 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-10">
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="" className="h-6 w-6 opacity-80" />
          <span>Lạc Việt Film — Mở phim, chạm hồn Việt.</span>
        </div>
        <div>Code bởi Nam NpT</div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    registerPwa();
    initTvPlatform();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
        <PlayerHostProvider>
        <div className="site-shell min-h-screen bg-background text-foreground">
          <a href="#main-content" className="skip-link">Bỏ qua điều hướng</a>
          <Header />
          <main id="main-content" className="pt-14 md:pt-16">
            <Outlet />
          </main>
          <Footer />
          <div className="h-28 md:h-32" />
          <DockBar />
          <QuickSearch />
          <TvRemote />
          <CreditBadge />
          <Onboarding />


          <Toaster
            position="top-center"
            richColors
            icons={{
              success: <img src="https://files.catbox.moe/g9s33j.svg" alt="" aria-hidden="true" className="dynamic-toast-icon" />,
              error: <img src="https://files.catbox.moe/5vs8z4.svg" alt="" aria-hidden="true" className="dynamic-toast-icon" />,
            }}
            toastOptions={{ className: "dynamic-glass-toast" }}
          />
        </div>
        </PlayerHostProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
