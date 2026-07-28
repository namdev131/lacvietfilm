import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Heart, History, LogIn, UserRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useHistory } from "@/hooks/useUserData";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Tài khoản của tôi | Lạc Việt Cinema" },
      { name: "description", content: "Quản lý tài khoản, phim yêu thích và lịch sử xem trên Lạc Việt Cinema." },
      { property: "og:title", content: "Tài khoản — Lạc Việt Cinema" },
      { property: "og:description", content: "Quản lý tài khoản, phim yêu thích và lịch sử xem." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const favorites = useFavorites();
  const history = useHistory();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16"><div className="h-40 rounded-2xl bg-card shimmer" /></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 pb-32 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <UserRound className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập để lưu phim yêu thích, đồng bộ lịch sử xem trên mọi thiết bị.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <LogIn className="h-4 w-4" /> Đăng nhập / Đăng ký
        </Link>
      </div>
    );
  }

  const meta = user.user_metadata ?? {};
  const displayName = (meta.display_name as string) || (meta.full_name as string) || user.email?.split("@")[0];
  const avatar = meta.avatar_url as string | undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-10">
      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur">
        {avatar ? (
          <img src={avatar} alt={displayName} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
            {displayName?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{displayName}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard to="/favorites" icon={<Heart className="h-5 w-5 text-primary" />} label="Yêu thích" value={favorites.data?.length ?? 0} />
        <StatCard to="/history" icon={<History className="h-5 w-5 text-primary" />} label="Đã xem" value={history.data?.length ?? 0} />
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card/50 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Tài khoản được bảo vệ
        </div>
        <p className="mt-1 text-xs">Dữ liệu yêu thích và lịch sử chỉ mình bạn xem được.</p>
      </div>

      <button
        onClick={signOut}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:border-primary/60 hover:text-primary"
      >
        <LogOut className="h-4 w-4" /> Đăng xuất
      </button>
    </div>
  );
}

function StatCard({ to, icon, label, value }: { to: string; icon: React.ReactNode; label: string; value: number }) {
  return (
    <Link to={to} className="rounded-2xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </Link>
  );
}
