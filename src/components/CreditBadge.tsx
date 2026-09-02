import { BrandName } from "./BrandName";

const LOGO = "https://files.catbox.moe/6ua430.png";

export function CreditBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 hidden md:block">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg">
        <img src={LOGO} alt="" className="h-4 w-4 rounded object-contain" />
        <BrandName />
      </div>
    </div>
  );
}
