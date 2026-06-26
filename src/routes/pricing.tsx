import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { pricingQuery, periodLabel, type PricingItem } from "@/lib/pricing";
import { formatKZT } from "@/lib/mock-data";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  const { data = [], isLoading } = useQuery(pricingQuery());

  const packages = data.filter((i) => i.kind === "package");
  const services = data.filter((i) => i.kind === "service");
  const subs = data.filter((i) => i.kind === "subscription");

  if (isLoading)
    return (
      <>
        <AppHeader title="Тарифы" back />
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );

  return (
    <>
      <AppHeader title="Тарифы" back />
      <div className="space-y-6 px-4 pb-32 pt-4">
        <Section title="Пакеты продвижения">
          <div className="grid gap-3">
            {packages.map((p) => (
              <PackageCard key={p.id} item={p} />
            ))}
          </div>
        </Section>

        <Section title="Дополнительные услуги">
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="font-display text-sm font-bold text-primary">{formatKZT(s.price)}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Подписки">
          <div className="grid gap-3">
            {subs.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-base font-bold">{s.name}</h3>
                  <div className="font-display text-lg font-bold text-primary">
                    {s.price === 0 ? "Бесплатно" : `${formatKZT(s.price)} ${periodLabel(s.period)}`}
                  </div>
                </div>
                {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function PackageCard({ item }: { item: PricingItem }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-base font-bold">{item.name}</h3>
        <div className="font-display text-lg font-bold text-primary">{formatKZT(item.price)}</div>
      </div>
      {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
      {item.features.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
