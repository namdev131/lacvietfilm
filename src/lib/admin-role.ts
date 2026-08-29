export const ADMIN_EMAIL = "lacviet55@proton.me";
export const ADMIN_DISPLAY_NAME = "Lạc Việt Admin";

export type AdminRole = "admin" | "deputy_admin" | "member";
type UserLike = {
  id?: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export function adminRole(user?: UserLike | null): AdminRole {
  if (user?.email?.toLowerCase() === ADMIN_EMAIL) return "admin";
  return user?.app_metadata?.app_role === "deputy_admin" || user?.user_metadata?.app_role === "deputy_admin"
    ? "deputy_admin"
    : "member";
}

export function canManageUser(actor: AdminRole, target: AdminRole) {
  return actor === "admin" || (actor === "deputy_admin" && target !== "admin");
}

export function partyIdentity(user: UserLike & { id: string }) {
  const role = adminRole(user);
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    name:
      role === "admin"
        ? ADMIN_DISPLAY_NAME
        : String(metadata.display_name || metadata.full_name || user.email?.split("@")[0] || "Khán giả"),
    role,
  };
}
