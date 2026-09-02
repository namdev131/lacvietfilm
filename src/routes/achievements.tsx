import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Award, LockKeyhole } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SignInPrompt } from "@/components/SignInPrompt";

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlockedAt: string | null;
}

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Thành tích | Lạc Việt Film" },
      { name: "description", content: "Những cột mốc trên hành trình xem phim của bạn." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { user, session, loading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setPending(true);
    setError("");
    fetch("/api/watch-history", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: "achievements" }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as { achievements?: Achievement[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Không tải được thành tích");
        setAchievements(result.achievements ?? []);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError(reason instanceof Error ? reason.message : "Không tải được thành tích");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [session]);

  if (!loading && !user)
    return (
      <SignInPrompt
        title="Thành tích"
        desc="Đăng nhập để lưu và theo dõi các cột mốc xem phim của bạn."
      />
    );

  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 pt-10 md:px-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          Hành trình điện ảnh
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight">
          <Award className="h-8 w-8 text-primary" /> Thành tích
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hoàn thành các cột mốc để mở khóa huy hiệu.
        </p>
      </header>

      {(loading || pending) && (
        <section
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
          aria-label="Đang tải thành tích"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 rounded-2xl bg-card shimmer" />
          ))}
        </section>
      )}

      {!loading && !pending && error && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive"
        >
          <strong>Không tải được thành tích.</strong> {error}
        </div>
      )}

      {!loading && !pending && !error && !achievements.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Chưa có thành tích. Hãy xem và hoàn tất phim đầu tiên.
        </div>
      )}

      {!loading && !pending && !error && achievements.length > 0 && (
        <section
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
          aria-label="Huy hiệu thành tích"
        >
          {achievements.map((achievement) => {
            const value = Math.min(Math.max(achievement.progress, 0), achievement.target);
            const unlocked = Boolean(achievement.unlockedAt);
            return (
              <article
                key={achievement.key}
                className={`rounded-2xl border p-5 ${unlocked ? "border-primary/50 bg-primary/5" : "border-border bg-card/60 opacity-80"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-background text-2xl"
                    aria-hidden="true"
                  >
                    {achievement.icon || (unlocked ? "★" : <LockKeyhole className="h-6 w-6" />)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-black">{achievement.title}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                  {achievement.description}
                </p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-semibold">
                    <span>Tiến độ</span>
                    <span>
                      {value}/{achievement.target}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Tiến độ ${achievement.title}`}
                    aria-valuemin={0}
                    aria-valuenow={value}
                    aria-valuemax={achievement.target}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{
                        width: `${achievement.target > 0 ? (value / achievement.target) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
