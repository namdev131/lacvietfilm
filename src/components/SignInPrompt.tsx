import { Link } from "@tanstack/react-router";
import { LogIn, Lock } from "lucide-react";

export function SignInPrompt({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card ring-1 ring-border">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <Link
        to="/auth"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <LogIn className="h-4 w-4" /> Đăng nhập / Đăng ký
      </Link>
    </div>
  );
}
