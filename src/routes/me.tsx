import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  Heart,
  History,
  LogIn,
  UserRound,
  Settings as SettingsIcon,
  Bookmark,
  Ticket,
  Library,
  Bell,
  CalendarClock,
  Film,
  CheckCircle2,
  Shield,
  Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useHistory } from "@/hooks/useUserData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { CinemaTicket } from "@/components/CinemaTicket";
import { ticketOwnerLabel, uniqueTickets } from "@/lib/tickets";
import type { SourceId } from "@/lib/types";
import { staffLabel, staffRole } from "@/lib/staff";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Hộ chiếu điện ảnh | Lạc Việt Film" },
      { name: "description", content: "Kho vé, lịch sử và thông tin thành viên Lạc Việt Film." },
      { property: "og:title", content: "Hộ chiếu điện ảnh | Lạc Việt Film" },
      { property: "og:type", content: "profile" },
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
  const watchlist = useWatchlist();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-72 bg-card shimmer" />
      </div>
    );

  if (!user) {
    return (
      <div className="profile-guest mx-auto max-w-3xl px-4 pb-32 pt-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-card">
          <Ticket className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-black">Nhận hộ chiếu điện ảnh</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Đăng nhập để mỗi phim cấp một vé riêng, lưu kho vé và đồng bộ hành trình xem trên mọi
          thiết bị.
        </p>
        <Link
          to="/auth"
          className="mt-7 inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          <LogIn className="h-4 w-4" /> Đăng nhập / Đăng ký
        </Link>
      </div>
    );
  }

  const meta = user.user_metadata ?? {};
  const role = staffRole(user);
  const displayName = staffLabel(
    role,
    (meta.display_name as string) ||
      (meta.full_name as string) ||
      user.email?.split("@")[0] ||
      "Thành viên",
  );
  const avatar = meta.avatar_url as string | undefined;
  const tickets = uniqueTickets(history.data ?? []);
  const finished = (history.data ?? []).filter((item) => item.finished).length;
  const owner = ticketOwnerLabel({ displayName, email: user.email });
  const memberCode = `LV-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const isAdmin = role === "admin";

  return (
    <div className="profile-page mx-auto max-w-6xl px-4 pb-32 pt-8 md:px-8">
      <section className="passport-hero">
        <div className="passport-identity">
          {avatar ? (
            <img src={avatar} alt={displayName} />
          ) : (
            <div className="passport-avatar">{displayName[0]?.toUpperCase()}</div>
          )}
          <div className="min-w-0">
            <p className="passport-label">Hộ chiếu điện ảnh</p>
            <h1 className="flex items-center gap-2">
              {displayName}
              {role !== "member" && (
                <Shield
                  className="h-5 w-5 text-primary"
                  aria-label={role === "admin" ? "Admin" : "Phó Admin"}
                />
              )}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="passport-code">
          <span>Mã thành viên</span>
          <strong>{memberCode}</strong>
          <small>Thành viên Lạc Việt</small>
        </div>
      </section>

      <section className="profile-bento" aria-label="Không gian cá nhân">
        <div className="bento-stats profile-stats" aria-label="Thống kê cá nhân">
          <StatCard
            to="/favorites"
            icon={<Heart />}
            label="Yêu thích"
            value={favorites.data?.length ?? 0}
          />
          <StatCard
            to="/watchlist"
            icon={<Bookmark />}
            label="Xem sau"
            value={watchlist.data?.length ?? 0}
          />
          <StatCard
            to="/history"
            icon={<History />}
            label="Đã xem"
            value={history.data?.length ?? 0}
          />
          <StatCard to="/history" icon={<CheckCircle2 />} label="Hoàn tất" value={finished} />
        </div>

        <div className="bento-ticket-vault ticket-vault">
          <div className="profile-section-head">
            <div>
              <p>Kho lưu niệm</p>
              <h2>Vé phim của bạn</h2>
            </div>
            <Link to="/history">Xem lịch sử</Link>
          </div>
          {tickets.length ? (
            <div className="ticket-stack">
              {tickets.slice(0, 6).map((item) => (
                <CinemaTicket
                  key={`${item.source}:${item.slug}`}
                  compact
                  slug={item.slug}
                  name={item.name}
                  poster={item.poster}
                  source={item.source as SourceId}
                  userId={user.id}
                  owner={owner}
                  episode={item.episode_name}
                />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <Film className="h-7 w-7" />
              <p>Vé đầu tiên xuất hiện khi bạn mở một bộ phim.</p>
              <Link to="/">Chọn phim</Link>
            </div>
          )}
        </div>

        <aside className="bento-actions profile-actions">
          <h2>Quầy tiện ích</h2>
          <QuickLink
            to="/collections"
            icon={<Library />}
            title="Bộ sưu tập"
            text="Sắp phim thành danh sách riêng"
          />
          <QuickLink
            to="/notifications"
            icon={<Bell />}
            title="Thông báo"
            text="Theo dõi tập mới và hoạt động"
          />
          <QuickLink
            to="/upcoming"
            icon={<CalendarClock />}
            title="Lịch sắp chiếu"
            text="Đón phim sắp ra mắt"
          />
          <QuickLink
            to="/achievements"
            icon={<Award />}
            title="Thành tích"
            text="Xem huy hiệu và tiến độ cột mốc"
          />
          <QuickLink
            to="/settings"
            icon={<SettingsIcon />}
            title="Cài đặt"
            text="Hồ sơ, trình phát, quyền riêng tư"
          />
          {isAdmin && (
            <QuickLink
              to="/admin"
              icon={<Shield />}
              title="Dashboard Admin"
              text="Quản lý người dùng và Watch Party"
            />
          )}
          <button onClick={signOut} className="profile-signout">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </aside>
        <div className="bento-member-card">
          <Ticket className="h-5 w-5" />
          <div>
            <small>Kho vé cá nhân</small>
            <strong>{tickets.length} vé đã cấp</strong>
          </div>
          <span>{memberCode}</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  to,
  icon,
  label,
  value,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link to={to} className="profile-stat">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </Link>
  );
}

function QuickLink({
  to,
  icon,
  title,
  text,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link to={to} className="profile-quick-link">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </Link>
  );
}
