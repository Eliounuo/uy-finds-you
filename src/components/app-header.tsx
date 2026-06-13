import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun, ChevronDown } from "lucide-react";
import { useApp } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
  showModeSwitcher?: boolean;
  transparent?: boolean;
};

export function AppHeader({ title, back, right, showModeSwitcher, transparent }: Props) {
  const { mode, setMode, theme, toggleTheme } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-30 flex items-center gap-2 px-4 pb-2",
        transparent ? "bg-transparent" : "border-b border-border bg-background/85 backdrop-blur-lg"
      )}
    >
      {back ? (
        <button
          onClick={() => history.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : (
        <Link to={mode === "lite" ? "/" : "/pro"} className="flex items-center gap-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            U
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">UY</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
              {mode}
            </span>
          </div>
        </Link>
      )}

      {title && <h1 className="ml-1 truncate font-display text-lg font-semibold">{title}</h1>}

      <div className="ml-auto flex items-center gap-1.5">
        {showModeSwitcher && (
          <button
            onClick={() => setMode(mode === "lite" ? "pro" : "lite")}
            className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground"
            aria-label="Переключить режим"
          >
            {mode === "lite" ? "Lite" : "Pro"}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Тема"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {right}
      </div>
    </header>
  );
}
