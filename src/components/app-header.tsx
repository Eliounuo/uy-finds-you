import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** @deprecated Role switching now happens via Profile → Сдача недвижимости */
  showModeSwitcher?: boolean;
  transparent?: boolean;
};

export function AppHeader({ title, back, right, transparent }: Props) {
  const { mode } = useApp();

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
        <Link to={mode === "pro" ? "/pro" : "/"} className="flex items-center gap-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            U
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">UY</span>
            {mode === "pro" && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                Кабинет
              </span>
            )}
          </div>
        </Link>
      )}

      {title && <h1 className="ml-1 truncate font-display text-lg font-semibold">{title}</h1>}

      <div className="ml-auto flex items-center gap-1.5">
        {right}
      </div>
    </header>
  );
}

