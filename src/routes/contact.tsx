import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Clock3, Mail, MessageSquareText, Send } from "lucide-react";
import { BrandName } from "@/components/BrandName";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Liên hệ | Lạc Việt Film" },
      { name: "description", content: "Gửi góp ý, báo lỗi phim hoặc liên hệ với đội ngũ Lạc Việt Film." },
      { property: "og:title", content: "Liên hệ | Lạc Việt Film" },
      { property: "og:description", content: "Gửi góp ý và báo lỗi cho đội ngũ Lạc Việt Film." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

const EMAIL = "lacviet55@proton.me";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Góp ý trải nghiệm");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = [
      `Tên: ${name.trim()}`,
      `Email phản hồi: ${email.trim()}`,
      "",
      message.trim(),
    ].join("\n");
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`[Lạc Việt Film] ${topic}`)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-36 pt-8 md:px-8 md:pt-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Trang chủ
      </Link>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:gap-14">
        <section className="contact-intro flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-border bg-card p-7 md:min-h-[38rem] md:p-10">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h1 className="mt-8 max-w-[10ch] text-4xl font-black leading-[.95] tracking-[-.055em] md:text-6xl">
              Gửi lời nhắn đến phòng chiếu.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Báo phim lỗi, góp ý trình phát hoặc chia sẻ điều bạn muốn thấy trên <BrandName />.
            </p>
          </div>

          <div className="mt-12 grid gap-5 border-t border-border pt-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <a href={`mailto:${EMAIL}`} className="group min-w-0">
              <Mail className="h-4 w-4 text-primary" />
              <span className="mt-3 block text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Email</span>
              <span className="mt-1 block truncate font-bold group-hover:text-primary">{EMAIL}</span>
            </a>
            <div>
              <Clock3 className="h-4 w-4 text-primary" />
              <span className="mt-3 block text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Phản hồi</span>
              <span className="mt-1 block font-bold">Trong 1-2 ngày</span>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border bg-background p-6 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_8%,transparent)] md:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Nội dung liên hệ</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Điền đủ thông tin để đội ngũ xử lý nhanh hơn.</p>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tên của bạn" htmlFor="contact-name">
                <input id="contact-name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Email phản hồi" htmlFor="contact-email">
                <input id="contact-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Chủ đề" htmlFor="contact-topic">
              <select id="contact-topic" value={topic} onChange={(event) => setTopic(event.target.value)} className={inputClass}>
                <option>Góp ý trải nghiệm</option>
                <option>Báo phim hoặc tập lỗi</option>
                <option>Vấn đề tài khoản</option>
                <option>Hợp tác nội dung</option>
                <option>Khác</option>
              </select>
            </Field>

            <Field label="Lời nhắn" htmlFor="contact-message">
              <textarea
                id="contact-message"
                required
                minLength={10}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tên phim, tập, nguồn phát và lỗi bạn gặp..."
                className={`${inputClass} min-h-44 resize-y`}
              />
            </Field>

            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:translate-y-px sm:w-fit">
              <Send className="h-4 w-4" /> Gửi qua email
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">Nút gửi mở ứng dụng email trên thiết bị. <BrandName /> không lưu nội dung biểu mẫu.</p>
          </form>
        </section>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="grid gap-2 text-sm font-bold">
      {label}
      {children}
    </label>
  );
}
