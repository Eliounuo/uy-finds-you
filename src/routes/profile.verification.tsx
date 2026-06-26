import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/verification")({ component: VerificationPage });

const verifReqQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["verification-request", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

function VerificationPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));
  const { data: lastReq } = useQuery(verifReqQuery(user?.id ?? null));
  const [file, setFile] = useState<File | null>(null);

  const status = profile?.verification_status ?? "unverified";

  const upload = useMutation({
    mutationFn: async () => {
      if (!user || !file) throw new Error("Выберите файл");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("verification-docs")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>)("submit_verification_request", {
        _doc_url: path,
      });
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success("Документ отправлен на проверку");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["verification-request", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AppHeader title="Верификация" back />
      <div className="space-y-4 px-4 pt-2 pb-32">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-2">
            {status === "verified" && <ShieldCheck className="h-5 w-5 text-primary" />}
            {status === "pending" && <ShieldQuestion className="h-5 w-5 text-muted-foreground" />}
            {(status === "unverified" || status === "rejected") && (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
            <div className="font-display font-bold">
              {status === "verified" && "Профиль верифицирован"}
              {status === "pending" && "На проверке"}
              {status === "unverified" && "Не верифицирован"}
              {status === "rejected" && "Верификация отклонена"}
            </div>
          </div>
          {lastReq?.review_note && (
            <p className="mt-2 text-xs text-muted-foreground">{lastReq.review_note}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Загрузите документ (паспорт / удостоверение / документ о праве собственности). Файл
            виден только модераторам UY и удаляется после проверки.
          </p>
        </div>

        {status !== "verified" && status !== "pending" && (
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <label className="block">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Документ</div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-background p-3 ring-1 ring-border">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </div>
            </label>
            <button
              onClick={() => upload.mutate()}
              disabled={!file || upload.isPending}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-60"
            >
              {upload.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Отправить"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
