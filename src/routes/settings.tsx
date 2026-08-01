import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Film, Gauge, Languages, LogOut, Monitor, Palette, PlayCircle,
  Save, ShieldCheck, Sparkles, Trash2, UserRound, KeyRound, Database, CloudUpload, Bookmark, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { clearSearchHistory } from "@/lib/searchHistory";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Cài đặt | Lạc Việt Cinema" },
      { name: "description", content: "Tuỳ chỉnh trình phát, nguồn phim, giao diện, quyền riêng tư và tài khoản trên Lạc Việt Cinema." },
      { property: "og:title", content: "Cài đặt — Lạc Việt Cinema" },
      { property: "og:description", content: "Tuỳ chỉnh trình phát, nguồn phim, giao diện và tài khoản." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, set, reset, syncState, pushNow, lastSyncedAt } = useSettings();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(meta.display_name || meta.full_name || "");
    setAvatar(meta.avatar_url || "");
  }, [user?.id]);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: name, avatar_url: avatar } });
    if (!error) {
      await supabase.from("profiles").upsert(
        { id: user.id, display_name: name || null, avatar_url: avatar || null } as never,
        { onConflict: "id" },
      );
    }
    setBusy(false);
    error ? toast.error(error.message) : toast.success("Đã lưu hồ sơ");
  }

  async function changePassword() {
    if (pwd.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPwd("");
    toast.success("Đã đổi mật khẩu");
  }

  async function clearCloud(table: "watch_history" | "favorites" | "watchlist") {
    if (!user) return;
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(
      table === "favorites" ? "Đã xoá danh sách yêu thích" : table === "watchlist" ? "Đã xoá danh sách Xem sau" : "Đã xoá lịch sử xem",
    );
  }

  function clearLocal() {
    clearSearchHistory();
    try {
      localStorage.removeItem("lv-progress");
    } catch {
      /* ignore */
    }
    toast.success("Đã xoá dữ liệu trên thiết bị này");
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-8">
      <div className="flex items-center gap-3">
        <Link to="/me" className="rounded-full border border-border p-2 hover:border-primary/60" aria-label="Quay lại">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">Tuỳ chỉnh trải nghiệm xem phim của bạn.</p>
        </div>
      </div>

      {/* Tài khoản */}
      <Section icon={<UserRound className="h-4 w-4" />} title="Tài khoản">
        {loading ? (
          <div className="h-20 rounded-xl bg-muted/40 shimmer" />
        ) : !user ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Đăng nhập để đồng bộ cài đặt tài khoản, yêu thích và lịch sử.</p>
            <Link to="/auth" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt={name || "Ảnh đại diện"} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/40" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                  {(name || user.email || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold">{name || "Chưa đặt tên"}</div>
                <div className="truncate text-muted-foreground">{user.email}</div>
              </div>
            </div>

            <Field label="Tên hiển thị">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên của bạn" className={inputCls} />
            </Field>
            <Field label="Ảnh đại diện (URL)">
              <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className={inputCls} />
            </Field>
            <button onClick={saveProfile} disabled={busy} className={btnPrimary}>
              <Save className="h-4 w-4" /> Lưu hồ sơ
            </button>

            <div className="border-t border-border/60 pt-4">
              <Field label="Đổi mật khẩu">
                <div className="flex gap-2">
                  <input
                    type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                    placeholder="Mật khẩu mới" className={inputCls}
                  />
                  <button onClick={changePassword} disabled={busy} className={btnGhost}>
                    <KeyRound className="h-4 w-4" /> Đổi
                  </button>
                </div>
              </Field>
            </div>

            <button onClick={signOut} className={`${btnGhost} w-full justify-center`}>
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        )}
      </Section>

      {/* Đồng bộ Cloud */}
      <Section icon={<CloudUpload className="h-4 w-4" />} title="Đồng bộ giữa các thiết bị">
        <Toggle
          label="Đồng bộ cài đặt lên Cloud"
          desc="Cài đặt của bạn tự áp dụng trên điện thoại, máy tính và TV khi cùng đăng nhập."
          checked={settings.cloudSync}
          onChange={(v) => set("cloudSync", v)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {!user
              ? "Đăng nhập để bật đồng bộ."
              : !settings.cloudSync
                ? "Đang tắt — cài đặt chỉ lưu trên thiết bị này."
                : syncState === "syncing"
                  ? "Đang đồng bộ…"
                  : syncState === "error"
                    ? "Đồng bộ lỗi, thử lại nhé."
                    : lastSyncedAt
                      ? `Đã đồng bộ lúc ${new Date(lastSyncedAt).toLocaleTimeString("vi-VN")}`
                      : "Sẵn sàng đồng bộ."}
          </span>
          {user && settings.cloudSync && (
            <button onClick={() => void pushNow()} className={btnGhost}>
              <RefreshCw className={`h-4 w-4 ${syncState === "syncing" ? "animate-spin" : ""}`} /> Đồng bộ ngay
            </button>
          )}
        </div>
        <Link to="/watchlist" className={`${btnGhost} w-full justify-center`}>
          <Bookmark className="h-4 w-4" /> Mở danh sách Xem sau
        </Link>
      </Section>

      {/* Phát phim */}
      <Section icon={<PlayCircle className="h-4 w-4" />} title="Phát phim">
        <Row label="Chế độ mặc định" desc="Ưu tiên HLS (m3u8) hoặc trình nhúng Embed.">
          <Segmented
            value={settings.defaultMode}
            options={[{ v: "hls", l: "HLS" }, { v: "embed", l: "Embed" }]}
            onChange={(v) => set("defaultMode", v as "hls" | "embed")}
          />
        </Row>
        <Toggle label="Tự chuyển Embed khi HLS lỗi" desc="Không gián đoạn khi nguồn m3u8 chết."
          checked={settings.autoFallback} onChange={(v) => set("autoFallback", v)} />
        <Toggle label="Tự phát khi mở phim" desc="Bắt đầu phát ngay khi trang xem tải xong."
          checked={settings.autoPlay} onChange={(v) => set("autoPlay", v)} />
        <Toggle label="Tự chuyển tập tiếp theo" desc="Hết tập sẽ tự sang tập kế."
          checked={settings.autoNext} onChange={(v) => set("autoNext", v)} />
        <Toggle label="Mini player khi rời trang" desc="Phim tiếp tục chạy ở góc màn hình, kéo thả tự do."
          checked={settings.miniPlayer} onChange={(v) => set("miniPlayer", v)} />
      </Section>

      {/* Nguồn phim */}
      <Section icon={<Film className="h-4 w-4" />} title="Nguồn phim & ngôn ngữ">
        <Row label="Nguồn mặc định" desc="Dùng cho trang chủ và tìm kiếm.">
          <Segmented
            value={settings.defaultSource}
            options={[
              { v: "all", l: "Tất cả" }, { v: "kkphim", l: "KKPhim" },
              { v: "ophim", l: "OPhim" }, { v: "nguonc", l: "NguonC" }, { v: "vsmov", l: "VSMov" },
            ]}
            onChange={(v) => set("defaultSource", v as typeof settings.defaultSource)}
          />
        </Row>
        <Row label="Ngôn ngữ ưu tiên" desc="Tự chọn server Vietsub hoặc Thuyết minh khi có.">
          <Segmented
            value={settings.langPref}
            options={[{ v: "auto", l: "Tự động" }, { v: "vietsub", l: "Vietsub" }, { v: "thuyetminh", l: "Thuyết minh" }]}
            onChange={(v) => set("langPref", v as typeof settings.langPref)}
          />
        </Row>
      </Section>

      {/* Giao diện */}
      <Section icon={<Palette className="h-4 w-4" />} title="Giao diện & thiết bị">
        <Toggle label="Chế độ TV / Remote" desc="Viền focus vàng lớn, điều hướng bằng phím D-Pad."
          checked={settings.tvMode} onChange={(v) => set("tvMode", v)} icon={<Monitor className="h-4 w-4" />} />
        <Toggle label="Giảm hiệu ứng chuyển động" desc="Tắt animation cho máy yếu hoặc khi dễ chóng mặt."
          checked={settings.reduceMotion} onChange={(v) => set("reduceMotion", v)} icon={<Gauge className="h-4 w-4" />} />
      </Section>

      {/* Riêng tư & dữ liệu */}
      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Quyền riêng tư & dữ liệu">
        <Toggle label="Lưu lịch sử xem" desc="Tắt để không ghi lại phim bạn đã xem."
          checked={settings.saveHistory} onChange={(v) => set("saveHistory", v)} />
        <Toggle label="Lưu lịch sử tìm kiếm" desc="Gợi ý từ khoá đã tìm trước đó."
          checked={settings.saveSearchHistory} onChange={(v) => set("saveSearchHistory", v)} icon={<Languages className="h-4 w-4" />} />

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={clearLocal} className={btnGhost}>
            <Database className="h-4 w-4" /> Xoá dữ liệu trên thiết bị
          </button>
          {user && (
            <>
              <button onClick={() => clearCloud("watch_history")} className={btnDanger}>
                <Trash2 className="h-4 w-4" /> Xoá lịch sử xem
              </button>
              <button onClick={() => clearCloud("favorites")} className={btnDanger}>
                <Trash2 className="h-4 w-4" /> Xoá yêu thích
              </button>
              <button onClick={() => clearCloud("watchlist")} className={btnDanger}>
                <Trash2 className="h-4 w-4" /> Xoá danh sách Xem sau
              </button>
            </>
          )}
        </div>
      </Section>

      <button onClick={reset} className={`${btnGhost} mt-6 w-full justify-center`}>
        <Sparkles className="h-4 w-4" /> Khôi phục cài đặt mặc định
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mặc định: {DEFAULT_SETTINGS.defaultMode.toUpperCase()} · nguồn “Tất cả” · tự chuyển tập.
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-primary/60 hover:text-primary";
const btnDanger =
  "inline-flex items-center gap-2 rounded-xl border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted/40 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label, desc, checked, onChange, icon,
}: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-transparent px-1 py-1 text-left hover:border-border/60"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon && <span className="text-primary">{icon}</span>} {label}
        </span>
        {desc && <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
