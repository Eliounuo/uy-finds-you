import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PricingKind = "package" | "service" | "subscription";
export type PricingPeriod = "one_time" | "month" | "year" | "week";

export interface PricingItem {
  id: string;
  kind: PricingKind;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  period: PricingPeriod;
  features: string[];
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const periodLabel = (p: PricingPeriod) =>
  ({ one_time: "разово", month: "/ месяц", year: "/ год", week: "/ неделю" }[p]);

export const pricingQuery = (opts?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: ["pricing", opts?.includeInactive ?? false],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("pricing_items" as never).select("*").order("kind").order("sort_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PricingItem[];
    },
  });
