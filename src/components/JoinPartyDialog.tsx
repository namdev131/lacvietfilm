import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function JoinPartyDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!user) {
      setOpen(false);
      navigate({ to: "/auth", search: { next: normalized ? `/party/${normalized}` : undefined } });
      return;
    }
    if (!/^[A-Z2-9]{6}$/.test(normalized)) {
      toast.error("Mã phòng gồm 6 ký tự");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("join_party", { _code: normalized });
    setBusy(false);
    if (error || !data) {
      toast.error("Không tìm thấy phòng hoặc phòng đã đóng");
      return;
    }
    setOpen(false);
    navigate({ to: "/party/$code", params: { code: normalized } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-full px-2.5 sm:px-3" aria-label="Nhập mã phòng">
          <DoorOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Nhập mã phòng</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle>Vào phòng xem chung</DialogTitle>
          <DialogDescription>Nhập mã 6 ký tự mà chủ phòng đã gửi cho bạn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={join} className="space-y-3">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))}
            placeholder="ABC234"
            aria-label="Mã phòng"
            className="h-12 w-full rounded-md border border-input bg-background px-4 text-center text-lg font-bold uppercase tracking-[0.3em] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <DoorOpen />}
            {user ? "Vào phòng" : "Đăng nhập để vào phòng"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}