import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import { useApp, type Theme } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/theme")({
  component: ThemeSettings,
});

function ThemeSettings() {
  const { theme, toggleTheme } = useApp();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 pb-2 backdrop-blur-lg">
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Тема</h1>
      </header>

      <main className="px-4 pt-4">
        <div className="space-y-3">
          <ThemeOption
            label="Светлая"
            icon={Sun}
            active={theme === "light"}
            onClick={() => {
              if (theme !== "light") toggleTheme();
            }}
          />
          <ThemeOption
            label="Тёмная"
            icon={Moon}
            active={theme === "dark"}
            onClick={() => {
              if (theme !== "dark") toggleTheme();
            }}
          />
        </div>
      </main>
    </div>
  );
}

function ThemeOption({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="flex-1 font-display font-semibold">{label}</span>
      {active && <Check className="h-5 w-5 text-primary" />}
    </button>
  );
}
