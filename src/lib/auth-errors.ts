/** Chuyển thông báo lỗi đăng nhập/đăng ký sang tiếng Việt dễ hiểu. */
const MAP: [RegExp, string][] = [
  [/invalid login credentials/i, "Email hoặc mật khẩu không đúng."],
  [/email not confirmed/i, "Email chưa được xác minh. Hãy kiểm tra hộp thư của bạn."],
  [/user already registered|already registered/i, "Email này đã có tài khoản. Hãy đăng nhập."],
  [/password should be at least/i, "Mật khẩu phải có ít nhất 6 ký tự."],
  [/pwned|compromised/i, "Mật khẩu này đã bị lộ trong các vụ rò rỉ dữ liệu. Hãy chọn mật khẩu khác."],
  [/rate limit|too many requests|over_email_send_rate_limit/i, "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."],
  [/invalid email/i, "Địa chỉ email không hợp lệ."],
  [/network|failed to fetch/i, "Mất kết nối mạng. Vui lòng thử lại."],
];

export function authErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  for (const [re, msg] of MAP) if (re.test(raw)) return msg;
  return raw || "Có lỗi xảy ra, vui lòng thử lại.";
}

/** Điểm mạnh mật khẩu 0-4 kèm nhãn tiếng Việt. */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  return { score, label: labels[score] ?? "Yếu" };
}
