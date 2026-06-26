import { useEffect, useState, type ReactNode } from "react";
import { Home as HomeIcon } from "lucide-react";
import { resolvePhotoUrl } from "@/lib/use-property-photos";
import { cn } from "@/lib/utils";

function optimizeUrl(url: string, width?: number): string {
  if (!url) return url;
  // Optimize Unsplash images: serve a smaller, compressed variant
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      if (width) u.searchParams.set("w", String(width));
      u.searchParams.set("q", "70");
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-muted to-accent text-muted-foreground",
        className,
      )}
    >
      <HomeIcon className="h-8 w-8 opacity-60" />
      <span className="text-[11px] font-medium">Фото скоро</span>
    </div>
  );
}

export function SignedImg({
  path,
  alt = "",
  className,
  loading = "lazy",
  width,
  fallback,
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
  fallback?: ReactNode;
}) {
  const isHttp = !!path && /^https?:\/\//.test(path);
  const [url, setUrl] = useState<string>(isHttp ? optimizeUrl(path!, width) : "");
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
    if (!path) {
      setUrl("");
      return;
    }
    if (/^https?:\/\//.test(path)) {
      setUrl(optimizeUrl(path, width));
      return;
    }
    let alive = true;
    resolvePhotoUrl(path)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => alive && setErrored(true));
    return () => {
      alive = false;
    };
  }, [path, width]);

  if (!path || errored || !url) {
    return <>{fallback ?? <Placeholder className={className} />}</>;
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setErrored(true)}
    />
  );
}

