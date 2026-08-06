import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, MailCheck, Lock, Play, Sparkles, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authErrorMessage, passwordStrength } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
      ? { next: s.next }
      : {},
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

type Tab = "login" | "signup" | "magic";

function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { user, loading } = useAuth();

  const redirectTo = next ? `${window.location.origin}${next}` : window.location.origin;

  const goAfterAuth = () => {
    if (next) window.location.replace(next);
    else navigate({ to: "/me", replace: true });
  };

  useEffect(() => {
    if (!loading && user) goAfterAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, next]);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Chào mừng trở lại!");
        goAfterAuth();
      } else if (tab === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setSentTo(email);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Đã tạo tài khoản!");
          goAfterAuth();
        } else {
          setSentTo(email);
        }
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!sentTo) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) toast.error(authErrorMessage(error));
    else toast.success("Đã gửi lại email xác minh");
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectTo });
    if (result.error) {
      setBusy(false);
      toast.error("Không đăng nhập được bằng Google");
      return;
    }
    if (result.redirected) return;
    goAfterAuth();
  }

  async function resetPassword() {
    if (!email) return toast.info("Nhập email để đặt lại mật khẩu");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(authErrorMessage(error));
    else toast.success("Đã gửi liên kết đặt lại mật khẩu");
  }

  return (
    <div className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl items-center gap-10 overflow-hidden px-4 pb-32 pt-8 md:grid-cols-[1fr_440px] md:px-10">
      <section className="hidden md:block">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"><Play className="h-6 w-6 fill-current" /></div>
        <h1 className="max-w-xl text-5xl font-black leading-tight text-balance">Mọi bộ phim bạn yêu, ở cùng một nơi.</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Đăng nhập để tiếp tục xem trên mọi thiết bị, lưu phim yêu thích và tham gia phòng xem chung cùng bạn bè.</p>
        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-sm">
          {["Đồng bộ tiến độ xem", "Phòng xem chung", "Bộ sưu tập cá nhân", "Thông báo tập mới"].map((item) => <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" />{item}</div>)}
        </div>
      </section>

      <section>
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Trang chủ</Link>
        <div className="rounded-lg border border-border bg-card p-5 shadow-2xl md:p-7">
          {sentTo ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-black">Kiểm tra hộp thư của bạn</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Chúng tôi đã gửi liên kết tới <span className="font-semibold text-foreground">{sentTo}</span>. Mở email và bấm vào liên kết để hoàn tất.
              </p>
              <div className="mt-6 space-y-2">
                <Button type="button" onClick={resend} disabled={busy} className="w-full">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Gửi lại email
                </Button>
                <Button type="button" variant="outline" onClick={() => setSentTo(null)} className="w-full">
                  Dùng email khác
                </Button>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">Không thấy email? Hãy kiểm tra mục Spam / Quảng cáo.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black">
                {tab === "login" ? "Chào mừng trở lại" : tab === "signup" ? "Tạo tài khoản" : "Đăng nhập không mật khẩu"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tab === "login"
                  ? "Tiếp tục hành trình điện ảnh của bạn."
                  : tab === "signup"
                    ? "Bắt đầu lưu và xem phim theo cách của bạn."
                    : "Chúng tôi sẽ gửi liên kết đăng nhập tới email của bạn."}
              </p>
              <div className="mb-5 mt-6 grid grid-cols-3 gap-1 rounded-md bg-background p-1">
                {(["login", "signup", "magic"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="ghost"
                    onClick={() => setTab(t)}
                    className={`rounded-md py-2 text-xs font-semibold transition sm:text-sm ${
                      tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "login" ? "Đăng nhập" : t === "signup" ? "Đăng ký" : "Magic link"}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {tab === "signup" && (
                  <Field icon={<UserRound className="h-4 w-4" />}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tên hiển thị"
                      required
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
                {tab !== "magic" && (
                  <Field icon={<Lock className="h-4 w-4" />} action={<button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </Field>
                )}
                {tab === "signup" && password.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-1.5 flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-full flex-1 rounded-full ${i < strength.score ? "bg-gold" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{strength.label}</span>
                  </div>
                )}
                {tab === "login" && <button type="button" onClick={resetPassword} className="block w-full text-right text-xs text-primary hover:underline">Quên mật khẩu?</button>}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tab === "login" ? "Đăng nhập" : tab === "signup" ? "Tạo tài khoản" : (<><Sparkles className="h-4 w-4" /> Gửi liên kết đăng nhập</>)}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" onClick={handleGoogle} disabled={busy} className="w-full">
                <GoogleIcon /> Tiếp tục với Google
              </Button>
              <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách riêng tư của Lạc Việt Cinema.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-primary/60">
      <span className="text-muted-foreground">{icon}</span>
      {children}
      {action}
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
