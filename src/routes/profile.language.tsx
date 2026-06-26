import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import { SUPPORTED_LANGUAGES, setLanguage, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/profile/language")({
  component: LanguagePage,
});

const LABELS: Record<Language, { native: string; flag: string }> = {
  ru: { native: "Русский", flag: "🇷🇺" },
  kz: { native: "Қазақша", flag: "🇰🇿" },
  en: { native: "English", flag: "🇬🇧" },
};

function LanguagePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<Language>((i18n.language as Language) || "ru");

  useEffect(() => {
    setCurrent((i18n.language as Language) || "ru");
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/profile" })}
          aria-label={t("common.back")}
          className="grid h-9 w-9 place-items-center rounded-full bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-lg font-bold">{t("language.title")}</h1>
      </header>

      <div className="px-4 pt-4">
        <p className="mb-3 text-xs text-muted-foreground">{t("language.subtitle")}</p>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {SUPPORTED_LANGUAGES.map((lng) => {
            const active = current === lng;
            return (
              <button
                key={lng}
                onClick={() => {
                  setLanguage(lng);
                  setCurrent(lng);
                }}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0"
              >
                <span className="text-xl">{LABELS[lng].flag}</span>
                <span className="flex-1 text-sm font-semibold">{LABELS[lng].native}</span>
                {active && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
