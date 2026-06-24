import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo as never}
          className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
