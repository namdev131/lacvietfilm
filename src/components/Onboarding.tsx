import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, Heart, History, Search, Sparkles, Tv, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STEPS = [
  {
    icon: Search,
    title: "Tìm phim siêu nhanh",
    body: "Nhấn nút Tìm phim trên đầu trang (hoặc Ctrl + K) để tìm tức thì trên cả 4 nguồn phim. Có thể vừa xem vừa tìm mà không gián đoạn.",
  },
  {
    icon: Tv,
    title: "Chọn nguồn & chất lượng",
    body: "Trong trang xem có nút đổi HLS / Embed, chọn Vietsub hoặc Thuyết minh, và xem ping từng nguồn để đổi thủ công khi mạng chậm.",
  },
  {
    icon: History,
    title: "Xem tiếp mọi lúc",
    body: "Tiến độ xem được lưu tự động. Mở mục Lịch sử ở thanh dưới để tiếp tục đúng tập, đúng phút bạn đang dừng.",
  },
  {
    icon: Heart,
    title: "Yêu thích & bộ sưu tập",
    body: "Lưu phim vào Yêu thích, Xem sau, hoặc tạo bộ sưu tập riêng rồi chia sẻ link cho bạn bè.",
  },
  {
    icon: Users,
    title: "Xem chung (Watch Party)",
    body: "Tạo phòng từ trang xem để mọi người cùng xem đồng bộ và chat. Phòng cũ sẽ tự xoá sau khi kết thúc.",
  },
  {
    icon: Compass,
    title: "Khám phá & Bảng Vàng",
    body: "Duyệt theo thể loại, quốc gia, năm và theo dõi Bảng Vàng realtime để biết phim đang hot nhất.",
  },
];

const key = (uid: string) => `lvc-onboarded-${uid}`;

export function Onboarding() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    try {
      if (!localStorage.getItem(key(user.id))) {
        setStep(0);
        setOpen(true);
      }
    } catch {
      /* localStorage bị chặn */
    }
  }, [user, loading]);

  function close() {
    setOpen(false);
    if (user) {
      try {
        localStorage.setItem(key(user.id), "1");
      } catch {
        /* bỏ qua */
      }
    }
  }

  if (!open) return null;

  const current = STEPS[step]!;
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/20 to-transparent px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold">Chào mừng đến Lạc Việt Film</h2>
              <p className="text-xs text-muted-foreground">Hướng dẫn nhanh {step + 1}/{STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Đóng hướng dẫn"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-6">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">{current.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-4">
          <button onClick={close} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Bỏ qua hướng dẫn
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:border-primary/60"
              >
                Quay lại
              </button>
            )}
            {last ? (
              <Link
                to="/"
                onClick={close}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Bắt đầu xem phim
              </Link>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Tiếp tục
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Cho phép mở lại hướng dẫn từ trang Cài đặt */
export function resetOnboarding(userId: string) {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* bỏ qua */
  }
}
