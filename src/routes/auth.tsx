import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập | Lạc Việt Cinema" },
      { name: "description", content: "Đăng nhập hoặc tạo tài khoản Lạc Việt Cinema để lưu phim yêu thích và lịch sử xem." },
      { property: "og:title", content: "Đăng nhập — Lạc Việt Cinema" },
      { property: "og:description", content: "Tạo tài khoản để lưu phim yêu thích và lịch sử xem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/me", replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Chào mừng trở lại!");
        navigate({ to: "/me", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Đã tạo tài khoản! Kiểm tra email nếu cần xác minh.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Không đăng nhập được bằng Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/me", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 pb-32 pt-10">
      <h1 className="text-center text-2xl font-black tracking-tight">
        LẠC VIỆT <span className="text-primary">CINEMA</span>
      </h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Mở phim, chạm hồn Việt.</p>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "signup" && (
            <Field icon={<UserRound className="h-4 w-4" />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên hiển thị"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>
          )}
          <Field icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/60 py-2.5 text-sm font-medium transition hover:border-primary/60 disabled:opacity-60"
        >
          <GoogleIcon /> Tiếp tục với Google
        </button>
      </div>

      <Link to="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-foreground">
        Về trang nhà
      </Link>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-primary/60">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  );
}
