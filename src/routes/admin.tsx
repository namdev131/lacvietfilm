import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Film, Loader2, LogIn, MessageSquare, Plus, RefreshCw, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { staffRole } from "@/lib/staff";

type AdminUser = { id: string; email: string; display_name: string | null; role: "admin" | "deputy_admin" | "member"; created_at: string; last_sign_in_at: string | null };
type Party = { id: string; code: string; name: string; host_email: string | null; closed: boolean; created_at: string; member_count: number; message_count: number };

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin | Lạc Việt Film" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"users" | "parties">("users");
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [assignment, setAssignment] = useState({ userId: "", partyId: "" });
  const isAdmin = staffRole(user) === "admin";

  async function request(body?: Record<string, unknown>) {
    const response = await fetch("/api/admin", {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${session?.access_token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Thao tác thất bại");
    return data;
  }

  async function load() {
    setBusy(true);
    try {
      const data = await request();
      setUsers(data.users);
      setParties(data.parties);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dashboard");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/admin" }, replace: true });
    else if (!loading && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  async function act(body: Record<string, unknown>, message: string) {
    setBusy(true);
    try { await request(body); toast.success(message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Thao tác thất bại"); setBusy(false); }
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><Shield className="mx-auto h-12 w-12 text-destructive" /><h1 className="mt-4 text-2xl font-black">Không có quyền truy cập</h1><Link to="/" className="mt-6 inline-block bg-primary px-5 py-3 font-bold text-primary-foreground">Về trang phim</Link></div>;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Quản trị hệ thống</p><h1 className="flex items-center gap-2 text-3xl font-black"><BadgeCheck className="h-7 w-7 text-primary" /> Nhím Admin</h1></div>
        <div className="flex gap-2"><Link to="/" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold"><Film className="h-4 w-4" /> Xem phim</Link><button onClick={load} disabled={busy} className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Làm mới</button></div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3"><button onClick={() => setTab("users")} className={`p-4 text-left ${tab === "users" ? "bg-primary text-primary-foreground" : "bg-card"}`}><Users className="mb-2" /><strong>Quản lý người dùng</strong><small className="block">{users.length} tài khoản</small></button><button onClick={() => setTab("parties")} className={`p-4 text-left ${tab === "parties" ? "bg-primary text-primary-foreground" : "bg-card"}`}><Film className="mb-2" /><strong>Quản lý Watch Party</strong><small className="block">{parties.length} phòng</small></button></div>

      <section className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Thống kê cộng đồng">
        <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-primary" /><strong className="mt-2 block text-2xl">{users.length}</strong><small>Thành viên cộng đồng</small></div>
        <div className="rounded-xl border border-border bg-card p-4"><Film className="h-5 w-5 text-primary" /><strong className="mt-2 block text-2xl">{parties.filter((p) => !p.closed).length}</strong><small>Phòng đang mở</small></div>
        <div className="rounded-xl border border-border bg-card p-4"><MessageSquare className="h-5 w-5 text-primary" /><strong className="mt-2 block text-2xl">{parties.reduce((sum, p) => sum + Number(p.message_count || 0), 0)}</strong><small>Tin nhắn Watch Party</small></div>
        <span className="sr-only">Thống kê cộng đồng</span>
      </section>

      {tab === "users" ? <section className="mt-6">
        <form onSubmit={(e) => { e.preventDefault(); if (assignment.userId && assignment.partyId) void act({ action: "assignParty", ...assignment }, "Đã gắn người dùng vào phòng"); }} className="mb-3 grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
          <select required aria-label="Chọn người dùng" value={assignment.userId} onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })} className="border border-input bg-background px-3 py-2"><option value="">Chọn người dùng</option>{users.filter((item) => item.role !== "admin").map((item) => <option key={item.id} value={item.id}>{item.display_name || item.email}</option>)}</select>
          <select required aria-label="Chọn phòng Watch Party" value={assignment.partyId} onChange={(e) => setAssignment({ ...assignment, partyId: e.target.value })} className="border border-input bg-background px-3 py-2"><option value="">Chọn phòng Watch Party</option>{parties.filter((party) => !party.closed).map((party) => <option key={party.id} value={party.id}>{party.code} · {party.name}</option>)}</select>
          <button disabled={busy} className="bg-primary px-4 py-2 font-bold text-primary-foreground">Gắn vào phòng</button>
        </form>
        <form onSubmit={(e) => { e.preventDefault(); void act({ action: "createUser", ...form }, "Đã tạo người dùng"); setForm({ email: "", password: "", displayName: "" }); }} className="grid gap-2 bg-card p-4 md:grid-cols-4"><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-input bg-background px-3 py-2" /><input required minLength={6} type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-input bg-background px-3 py-2" /><input placeholder="Tên hiển thị" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="border border-input bg-background px-3 py-2" /><button disabled={busy} className="flex items-center justify-center gap-2 bg-primary px-4 py-2 font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Thêm</button></form>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[860px] bg-card text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Email</th><th>Tên</th><th>Vai trò</th><th>Ngày tạo</th><th>Đăng nhập cuối</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{users.map((item) => <UserRow key={item.id} item={item} adminId={user!.id} busy={busy} act={act} />)}</tbody></table></div>
      </section> : <section className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] bg-card text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Mã</th><th>Phim</th><th>Chủ phòng</th><th>Thành viên</th><th>Chat</th><th>Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{parties.map((party) => <tr key={party.id} className="border-b border-border/60"><td className="p-3 font-bold">{party.code}</td><td>{party.name}</td><td>{party.host_email || "—"}</td><td>{party.member_count}</td><td>{party.message_count}</td><td>{party.closed ? "Đã đóng" : "Đang mở"}</td><td className="p-3 text-right"><Link to="/party/$code" params={{ code: party.code }} className="mr-2 inline-flex items-center gap-1 border border-primary/50 px-3 py-1.5 text-primary"><LogIn className="h-3.5 w-3.5" /> Vào phòng</Link><button disabled={busy || party.closed} onClick={() => void act({ action: "closeParty", id: party.id }, "Đã đóng phòng")} className="mr-2 border border-border px-3 py-1.5 disabled:opacity-40">Đóng phòng</button><button disabled={busy} onClick={() => confirm("Xóa Watch Party này?") && void act({ action: "deleteParty", id: party.id }, "Đã xóa phòng")} className="bg-destructive px-3 py-1.5 text-destructive-foreground">Xóa</button></td></tr>)}</tbody></table></section>}
    </main>
  );
}

function UserRow({ item, adminId, busy, act }: { item: AdminUser; adminId: string; busy: boolean; act: (body: Record<string, unknown>, message: string) => Promise<void> }) {
  const [email, setEmail] = useState(item.email);
  const [displayName, setDisplayName] = useState(item.display_name || "");
  const protectedAdmin = item.role === "admin" || item.id === adminId;
  return <tr className="border-b border-border/60"><td className="p-3"><input disabled={protectedAdmin} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent disabled:opacity-70" /></td><td><input disabled={protectedAdmin} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-transparent disabled:opacity-70" /></td><td>{item.role === "admin" ? <span className="inline-flex items-center gap-1 font-bold text-primary"><BadgeCheck className="h-4 w-4" /> Nhím Admin</span> : item.role === "deputy_admin" ? <span className="font-bold text-primary">Phó Admin</span> : "Thành viên"}</td><td>{new Date(item.created_at).toLocaleDateString("vi-VN")}</td><td>{item.last_sign_in_at ? new Date(item.last_sign_in_at).toLocaleString("vi-VN") : "Chưa có"}</td><td className="p-3 text-right"><button disabled={busy || protectedAdmin} onClick={() => void act({ action: "setDeputy", id: item.id, enabled: item.role !== "deputy_admin" }, item.role === "deputy_admin" ? "Đã gỡ Phó Admin" : "Đã gắn Phó Admin")} className="mr-2 border border-primary/50 px-3 py-1.5 text-primary disabled:opacity-40">{item.role === "deputy_admin" ? "Gỡ Phó Admin" : "Gắn Phó Admin"}</button><button disabled={busy || protectedAdmin} onClick={() => void act({ action: "updateUser", id: item.id, email, displayName }, "Đã cập nhật")} className="mr-2 border border-border px-3 py-1.5 disabled:opacity-40">Lưu</button><button disabled={busy || protectedAdmin} onClick={() => confirm("Xóa người dùng này? Dữ liệu liên quan cũng sẽ bị xóa.") && void act({ action: "deleteUser", id: item.id }, "Đã xóa người dùng")} className="bg-destructive px-3 py-1.5 text-destructive-foreground disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></td></tr>;
}
