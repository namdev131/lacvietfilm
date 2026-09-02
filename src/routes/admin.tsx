import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Film,
  Loader2,
  LogIn,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isStaff, staffRole } from "@/lib/staff";

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "deputy_admin" | "member";
  created_at: string;
  last_sign_in_at: string | null;
};
type Party = {
  id: string;
  code: string;
  name: string;
  host_email: string | null;
  closed: boolean;
  join_locked: boolean;
  created_at: string;
  member_count: number;
  message_count: number;
};
type Permission = "watch_party.view" | "watch_party.warn" | "watch_party.close";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin | Lạc Việt Film" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const role = staffRole(user);
  const staff = isStaff(role);
  const isAdmin = role === "admin";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"users" | "parties">(isAdmin ? "users" : "parties");
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [assignment, setAssignment] = useState({ userId: "", partyId: "" });

  const request = useCallback(
    async (body?: Record<string, unknown>) => {
      const response = await fetch("/api/admin", {
        method: body ? "POST" : "GET",
        headers: {
          authorization: `Bearer ${session?.access_token}`,
          ...(body ? { "content-type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as {
        error?: string;
        users?: AdminUser[];
        parties?: Party[];
        permissions?: Permission[];
      };
      if (!response.ok) throw new Error(data.error || "Thao tác thất bại");
      return data;
    },
    [session?.access_token],
  );

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setBusy(true);
      try {
        const data = await request();
        setUsers(data.users ?? []);
        setParties(data.parties ?? []);
        setPermissions(data.permissions ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được dashboard");
      } finally {
        if (!quiet) setBusy(false);
      }
    },
    [request],
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: "/admin" }, replace: true });
    else if (!loading && staff) {
      void load();
      const refetchInterval = window.setInterval(() => void load(true), 10_000);
      return () => window.clearInterval(refetchInterval);
    }
    return undefined;
  }, [loading, user, staff, navigate, load]);

  async function act(body: Record<string, unknown>, message: string) {
    setBusy(true);
    try {
      await request(body);
      toast.success(message);
      await load();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại");
      setBusy(false);
      return false;
    }
  }

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!staff)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-black">Không có quyền truy cập</h1>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Về trang phim
        </Link>
      </div>
    );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Quản trị hệ thống
          </p>
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <BadgeCheck className="h-7 w-7 text-primary" /> {isAdmin ? "Nhím Admin" : "Phó Admin"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-bold"
          >
            <Film className="h-4 w-4" /> Xem phim
          </Link>
          <button
            onClick={() => void load()}
            disabled={busy}
            className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Làm mới
          </button>
        </div>
      </header>

      <div className={`mt-8 grid gap-3 ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
        {isAdmin && (
          <button
            onClick={() => setTab("users")}
            className={`p-4 text-left ${tab === "users" ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            <Users className="mb-2" />
            <strong>Quản lý người dùng</strong>
            <small className="block">{users.length} tài khoản</small>
          </button>
        )}
        <button
          onClick={() => setTab("parties")}
          className={`p-4 text-left ${tab === "parties" ? "bg-primary text-primary-foreground" : "bg-card"}`}
        >
          <Film className="mb-2" />
          <strong>Quản lý Watch Party</strong>
          <small className="block">{parties.length} phòng</small>
        </button>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Thống kê cộng đồng">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary" />
          <strong className="mt-2 block text-2xl">{users.length}</strong>
          <small>Thành viên cộng đồng</small>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Film className="h-5 w-5 text-primary" />
          <strong className="mt-2 block text-2xl">{parties.filter((p) => !p.closed).length}</strong>
          <small>Phòng đang mở</small>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <strong className="mt-2 block text-2xl">
            {parties.reduce((sum, p) => sum + Number(p.message_count || 0), 0)}
          </strong>
          <small>Tin nhắn Watch Party</small>
        </div>
      </section>

      {isAdmin && tab === "users" ? (
        <UsersPanel
          users={users}
          parties={parties}
          busy={busy}
          userId={user!.id}
          form={form}
          setForm={setForm}
          assignment={assignment}
          setAssignment={setAssignment}
          act={act}
        />
      ) : (
        <PartiesPanel parties={parties} permissions={permissions} busy={busy} act={act} />
      )}
    </main>
  );
}

function PartiesPanel({
  parties,
  permissions,
  busy,
  act,
}: {
  parties: Party[];
  permissions: Permission[];
  busy: boolean;
  act: (body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const canWarn = permissions.includes("watch_party.warn");
  const canClose = permissions.includes("watch_party.close");
  return (
    <section className="mt-6 grid gap-3">
      {parties.map((party) => (
        <article key={party.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>
                {party.code} · {party.name}
              </strong>
              <p className="text-sm text-muted-foreground">
                {party.host_email || "—"} · {party.member_count} thành viên · {party.message_count}{" "}
                chat · {party.closed ? "Đã đóng" : party.join_locked ? "Khóa tham gia" : "Đang mở"}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/party/$code"
                params={{ code: party.code }}
                className="inline-flex items-center gap-1 border border-primary/50 px-3 py-2 text-primary"
              >
                <LogIn className="h-4 w-4" /> Vào phòng
              </Link>
              {canClose && (
                <button
                  disabled={busy || party.closed}
                  onClick={() => void act({ action: "closeParty", id: party.id }, "Đã đóng phòng")}
                  className="border border-border px-3 py-2 disabled:opacity-40"
                >
                  Đóng phòng
                </button>
              )}
            </div>
          </div>
          {canWarn && !party.closed && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const message = warnings[party.id]?.trim();
                if (message)
                  void act({ action: "warnParty", id: party.id, message }, "Đã gửi cảnh báo").then(
                    (sent) => sent && setWarnings((value) => ({ ...value, [party.id]: "" })),
                  );
              }}
            >
              <label className="sr-only" htmlFor={`warning-${party.id}`}>
                Cảnh báo phòng {party.code}
              </label>
              <input
                id={`warning-${party.id}`}
                required
                minLength={1}
                maxLength={300}
                value={warnings[party.id] ?? ""}
                onChange={(event) =>
                  setWarnings((value) => ({ ...value, [party.id]: event.target.value }))
                }
                placeholder="Cảnh báo trực tiếp, tối đa 300 ký tự"
                className="min-w-0 flex-1 border border-input bg-background px-3 py-2"
              />
              <button
                disabled={busy}
                className="bg-primary px-4 py-2 font-bold text-primary-foreground"
              >
                Gửi cảnh báo
              </button>
            </form>
          )}
        </article>
      ))}
    </section>
  );
}

function UsersPanel({
  users,
  parties,
  busy,
  userId,
  form,
  setForm,
  assignment,
  setAssignment,
  act,
}: {
  users: AdminUser[];
  parties: Party[];
  busy: boolean;
  userId: string;
  form: { email: string; password: string; displayName: string };
  setForm: (value: { email: string; password: string; displayName: string }) => void;
  assignment: { userId: string; partyId: string };
  setAssignment: (value: { userId: string; partyId: string }) => void;
  act: (body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  return (
    <section className="mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (assignment.userId && assignment.partyId)
            void act({ action: "assignParty", ...assignment }, "Đã gắn người dùng vào phòng");
        }}
        className="mb-3 grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <select
          required
          aria-label="Chọn người dùng"
          value={assignment.userId}
          onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })}
          className="border border-input bg-background px-3 py-2"
        >
          <option value="">Chọn người dùng</option>
          {users
            .filter((item) => item.role !== "admin")
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name || item.email}
              </option>
            ))}
        </select>
        <select
          required
          aria-label="Chọn phòng Watch Party"
          value={assignment.partyId}
          onChange={(e) => setAssignment({ ...assignment, partyId: e.target.value })}
          className="border border-input bg-background px-3 py-2"
        >
          <option value="">Chọn phòng Watch Party</option>
          {parties
            .filter((party) => !party.closed)
            .map((party) => (
              <option key={party.id} value={party.id}>
                {party.code} · {party.name}
              </option>
            ))}
        </select>
        <button disabled={busy} className="bg-primary px-4 py-2 font-bold text-primary-foreground">
          Gắn vào phòng
        </button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act({ action: "createUser", ...form }, "Đã tạo người dùng");
          setForm({ email: "", password: "", displayName: "" });
        }}
        className="grid gap-2 bg-card p-4 md:grid-cols-4"
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border border-input bg-background px-3 py-2"
        />
        <input
          required
          minLength={6}
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border border-input bg-background px-3 py-2"
        />
        <input
          placeholder="Tên hiển thị"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className="border border-input bg-background px-3 py-2"
        />
        <button
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-primary px-4 py-2 font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Thêm
        </button>
      </form>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[860px] bg-card text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3">Email</th>
              <th>Tên</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Đăng nhập cuối</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <UserRow key={item.id} item={item} adminId={userId} busy={busy} act={act} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserRow({
  item,
  adminId,
  busy,
  act,
}: {
  item: AdminUser;
  adminId: string;
  busy: boolean;
  act: (body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(item.email);
  const [displayName, setDisplayName] = useState(item.display_name || "");
  const protectedAdmin = item.role === "admin" || item.id === adminId;
  return (
    <tr className="border-b border-border/60">
      <td className="p-3">
        <input
          disabled={protectedAdmin}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent disabled:opacity-70"
        />
      </td>
      <td>
        <input
          disabled={protectedAdmin}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-transparent disabled:opacity-70"
        />
      </td>
      <td>
        {item.role === "admin" ? (
          <span className="inline-flex items-center gap-1 font-bold text-primary">
            <BadgeCheck className="h-4 w-4" /> Nhím Admin
          </span>
        ) : item.role === "deputy_admin" ? (
          <span className="font-bold text-primary">Phó Admin</span>
        ) : (
          "Thành viên"
        )}
      </td>
      <td>{new Date(item.created_at).toLocaleDateString("vi-VN")}</td>
      <td>
        {item.last_sign_in_at ? new Date(item.last_sign_in_at).toLocaleString("vi-VN") : "Chưa có"}
      </td>
      <td className="p-3 text-right">
        <button
          disabled={busy || protectedAdmin}
          onClick={() =>
            void act(
              { action: "setDeputy", id: item.id, enabled: item.role !== "deputy_admin" },
              item.role === "deputy_admin" ? "Đã gỡ Phó Admin" : "Đã gắn Phó Admin",
            )
          }
          className="mr-2 border border-primary/50 px-3 py-1.5 text-primary disabled:opacity-40"
        >
          {item.role === "deputy_admin" ? "Gỡ Phó Admin" : "Gắn Phó Admin"}
        </button>
        <button
          disabled={busy || protectedAdmin}
          onClick={() =>
            void act({ action: "updateUser", id: item.id, email, displayName }, "Đã cập nhật")
          }
          className="mr-2 border border-border px-3 py-1.5 disabled:opacity-40"
        >
          Lưu
        </button>
        <button
          disabled={busy || protectedAdmin}
          onClick={() =>
            confirm("Xóa người dùng này? Dữ liệu liên quan cũng sẽ bị xóa.") &&
            void act({ action: "deleteUser", id: item.id }, "Đã xóa người dùng")
          }
          className="bg-destructive px-3 py-1.5 text-destructive-foreground disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
