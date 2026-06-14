import { useEffect, useState } from "react";
import { resolvePhotoUrl } from "@/lib/use-property-photos";

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

export function SignedImg({
  path,
  alt = "",
  className,
  loading = "lazy",
  width,
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
}) {
  // For http(s) URLs we can render synchronously without an effect round-trip
  const isHttp = !!path && /^https?:\/\//.test(path);
  const [url, setUrl] = useState<string>(isHttp ? optimizeUrl(path!, width) : "");

  useEffect(() => {
    if (!path) {
      setUrl("");
      return;
    }
    if (/^https?:\/\//.test(path)) {
      setUrl(optimizeUrl(path, width));
      return;
    }
    let alive = true;
    resolvePhotoUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path, width]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}
