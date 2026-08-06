import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Đặt lại mật khẩu | Lạc Việt Cinema" },
      { name: "description", content: "Tạo mật khẩu mới cho tài khoản Lạc Việt Cinema của bạn." },
      { property: "og:title", content: "Đặt lại mật khẩu — Lạc Việt Cinema" },
      { property: "og:description", content: "Tạo mật khẩu mới cho tài khoản Lạc Việt Cinema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Mật khẩu nhập lại không khớp");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Đã đổi mật khẩu thành công");
    navigate({ to: "/me", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-10">
      <Link to="/auth" className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
      </Link>
      <div className="rounded-lg border border-border bg-card p-6 shadow-2xl">
        <h1 className="text-2xl font-black">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Nhập mật khẩu mới cho tài khoản của bạn."
            : "Mở liên kết đặt lại mật khẩu trong email của bạn để tiếp tục."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-primary/60">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-primary/60">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" disabled={busy || !ready} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Cập nhật mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
}
