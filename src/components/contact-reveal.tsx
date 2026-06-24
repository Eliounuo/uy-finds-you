import { useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Phone, MessageCircle, Send, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const contactQuery = (userId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["contact-info", userId],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_info", { _user_id: userId });
      if (error) throw error;
      return (data?.[0] ?? null) as { phone: string | null; whatsapp: string | null; telegram: string | null } | null;
    },
  });

export function ContactReveal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery(contactQuery(userId, open));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-semibold ring-1 ring-border"
      >
        <Lock className="h-3.5 w-3.5" /> Показать контакты
      </button>
    );
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!data || (!data.phone && !data.whatsapp && !data.telegram)) {
    return (
      <p className="text-xs text-muted-foreground">
        Контакты откроются после подтверждённого бронирования.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {data.phone && (
        <a href={`tel:${data.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          <Phone className="h-3.5 w-3.5" /> {data.phone}
        </a>
      )}
      {data.whatsapp && (
        <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-2 text-xs font-semibold text-success">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      )}
      {data.telegram && (
        <a href={`https://t.me/${data.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          <Send className="h-3.5 w-3.5" /> Telegram
        </a>
      )}
    </div>
  );
}
