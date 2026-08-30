import type { User } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "lacviet55@proton.me";
export type StaffRole = "admin" | "deputy_admin" | "member";

export function staffRole(user: Pick<User, "email" | "app_metadata"> | null | undefined): StaffRole {
  if (user?.email?.toLowerCase() === ADMIN_EMAIL) return "admin";
  return user?.app_metadata?.role === "deputy_admin" ? "deputy_admin" : "member";
}

export function staffLabel(role: StaffRole, fallback = "Khán giả") {
  if (role === "admin") return "Lạc Việt Admin";
  if (role === "deputy_admin") return "Phó Admin Lạc Việt";
  return fallback;
}

export function isStaff(role: StaffRole) {
  return role === "admin" || role === "deputy_admin";
}
