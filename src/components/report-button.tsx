import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import type { Database } from "@/integrations/supabase/types";

type TargetType = Database["public"]["Enums"]["complaint_target"];

type Props = {
  targetType: TargetType;
  targetId: string;
  variant?: "icon" | "link";
  className?: string;
};

const REASONS = [
  "Мошенничество",
  "Недостоверная информация",
  "Грубое поведение",
  "Спам / реклама",
  "Другое",
];

export function ReportButton({ targetType, targetId, variant = "icon", className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Нужно войти");
      const { error } = await supabase.from("complaints").insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Жалоба отправлена. Мы проверим её в ближайшее время.");
      setOpen(false);
      setDescription("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-border"
          }
          aria-label="Пожаловаться"
        >
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={className ?? "text-xs text-muted-foreground underline"}
        >
          Пожаловаться
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="safe-bottom w-full rounded-t-3xl bg-background p-5"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h2 className="font-display text-lg font-bold">Пожаловаться</h2>

            <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">
              Причина
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl bg-card p-3 text-sm ring-1 ring-border"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">
              Опишите проблему (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className="mt-1 w-full resize-none rounded-xl bg-card p-3 text-sm ring-1 ring-border"
            />

            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-60"
            >
              {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Отправить"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
