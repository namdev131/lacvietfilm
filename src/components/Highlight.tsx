const strip = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Tô đậm phần khớp từ khoá (bỏ dấu, không phân biệt hoa thường) */
export function Highlight({ text, query }: { text: string; query?: string }) {
  const q = (query || "").replace(/\s+/g, " ").trim();
  if (!q || !text) return <>{text}</>;

  const hay = strip(text);
  const terms = Array.from(new Set([strip(q), ...strip(q).split(" ")])).filter(
    (t) => t.length >= 2,
  );
  const marks = new Array(text.length).fill(false);
  for (const t of terms) {
    let from = 0;
    while (from <= hay.length - t.length) {
      const i = hay.indexOf(t, from);
      if (i === -1) break;
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      from = i + t.length;
    }
  }
  if (!marks.some(Boolean)) return <>{text}</>;

  const parts: { s: string; on: boolean }[] = [];
  let buf = "";
  let on = marks[0];
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== on) {
      parts.push({ s: buf, on });
      buf = "";
      on = marks[i];
    }
    buf += text[i];
  }
  parts.push({ s: buf, on });

  return (
    <>
      {parts.map((p, i) =>
        p.on ? (
          <mark key={i} className="rounded bg-primary/25 px-0.5 text-primary">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{p.s}</span>
        ),
      )}
    </>
  );
}
