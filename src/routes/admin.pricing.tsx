import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pricingQuery, type PricingItem } from "@/lib/pricing";

export const Route = createFileRoute("/admin/pricing")({ component: AdminPricing });

const KIND_TITLE: Record<string, string> = {
  package: "Пакеты продвижения",
  service: "Дополнительные услуги",
  subscription: "Подписки",
};

function AdminPricing() {
  const { data = [], isLoading } = useQuery(pricingQuery({ includeInactive: true }));

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const groups: Record<string, PricingItem[]> = { package: [], service: [], subscription: [] };
  for (const it of data) groups[it.kind]?.push(it);

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Все цены хранятся в базе. Изменения применяются сразу — код не правится.
      </p>
      {(["package", "service", "subscription"] as const).map((k) => (
        <section key={k}>
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">{KIND_TITLE[k]}</h2>
          <div className="space-y-2">
            {groups[k].map((it) => (
              <Row key={it.id} item={it} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Row({ item }: { item: PricingItem }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(String(item.price));
  const [active, setActive] = useState(item.is_active);

  const save = useMutation({
    mutationFn: async () => {
      const next = Number(price);
      if (!Number.isFinite(next) || next < 0) throw new Error("Некорректная цена");
      const { error } = await supabase
        .from("pricing_items" as never)
        .update({ price: next, is_active: active } as never)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["pricing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty = price !== String(item.price) || active !== item.is_active;

  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-bold">{item.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.code}</div>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-9"
        />
        <span className="text-xs text-muted-foreground">₸</span>
        <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
