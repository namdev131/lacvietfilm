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
import { Search, Home as HomeIcon, Flame, Bookmark, Settings as SettingsIcon, Compass, CalendarClock, Library } from "lucide-react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { DockBar } from "@/components/DockBar";
import { QuickSearch, openQuickSearch } from "@/components/QuickSearch";
import { PlayerHostProvider } from "@/components/PlayerHost";
import { TvRemote } from "@/hooks/useTvRemote";
import { SettingsProvider } from "@/lib/settings";


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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Không tải được trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đã có lỗi xảy ra, vui lòng thử lại.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Thử lại
          </button>
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
      { title: "Lạc Việt Cinema — Mở phim, chạm hồn Việt" },
      { name: "description", content: "Xem phim trực tuyến tổng hợp từ KKPhim, OPhim, NguonC. HLS & Embed, Vietsub và Thuyết Minh." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "Lạc Việt Cinema" },
      { property: "og:description", content: "Mở phim, chạm hồn Việt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: LOGO, type: "image/png" },
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
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border/60" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:h-16 md:px-10">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO} alt="Lạc Việt Cinema" className="h-8 w-8 rounded object-contain" />
            <span className="hidden text-sm font-bold tracking-wide sm:inline">
              LẠC VIỆT <span className="text-primary">CINEMA</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" icon={<HomeIcon className="h-4 w-4" />} label="Trang nhà" />
            <NavLink to="/search" icon={<Search className="h-4 w-4" />} label="Tìm phim" />
          </nav>

        </div>
        <div className="flex items-center gap-2">
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
          <Link
            to="/watchlist"
            aria-label="Danh sách Xem sau"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          >
            <Bookmark className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            aria-label="Cài đặt"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            activeProps={{ className: "border-primary/60 text-primary" }}
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

    </header>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
      activeProps={{ className: "text-foreground bg-white/5" }}
    >
      {icon} {label}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-10">
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="" className="h-6 w-6 opacity-80" />
          <span>Lạc Việt Cinema — Mở phim, chạm hồn Việt.</span>
        </div>
        <div>Code bởi Nam NpT</div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
        <PlayerHostProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="pt-14 md:pt-16">
            <Outlet />
          </main>
          <Footer />
          <div className="h-24" />
          <DockBar />
          <QuickSearch />
          <TvRemote />

          <Toaster position="top-center" richColors />
        </div>
        </PlayerHostProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
