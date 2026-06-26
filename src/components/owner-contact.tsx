import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useState } from "react";
import { track } from "@/lib/analytics/posthog";

type Contact = { phone: string | null; whatsapp: string | null; telegram: string | null; full_name: string | null };

export function OwnerContactBar({ propertyId, price }: { propertyId: string; price: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  const { data } = useQuery({
    queryKey: ["property-contact", propertyId],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_property_contact", { _property_id: propertyId });
      if (error) throw error;
      return ((Array.isArray(data) ? data[0] : data) ?? null) as Contact | null;
    },
  });

  const phone = data?.phone ?? null;

  const openChat = async () => {
    track("booking_started", { property_id: propertyId, channel: "chat" });
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setOpening(true);
    const { data: chatId, error } = await supabase.rpc("get_or_create_direct_chat", { _property_id: propertyId });
    setOpening(false);
    if (error || !chatId) {
      toast.error(error?.message ?? "Не удалось открыть чат");
      return;
    }
    navigate({ to: "/chat/$id", params: { id: String(chatId) } });
  };

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <div className="mr-1 min-w-0">
          <div className="truncate font-display text-lg font-bold">{price}</div>
          <div className="text-[11px] text-muted-foreground">за сутки</div>
        </div>
        <a
          href={phone ? `tel:${phone}` : undefined}
          aria-disabled={!phone}
          onClick={(e) => {
            if (!phone) {
              e.preventDefault();
              toast.info("Владелец не указал телефон");
            }
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-card px-4 py-3 font-display text-sm font-bold ring-1 ring-border active:scale-[0.98]"
        >
          <Phone className="h-4 w-4" /> Позвонить
        </a>
        <button
          onClick={openChat}
          disabled={opening}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-60"
        >
          {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Написать
        </button>
      </div>
    </div>
  );
}
