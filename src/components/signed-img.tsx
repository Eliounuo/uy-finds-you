import { useEffect, useState } from "react";
import { resolvePhotoUrl } from "@/lib/use-property-photos";

export function SignedImg({
  path,
  alt = "",
  className,
  loading,
}: {
  path: string | undefined | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl("");
      return;
    }
    resolvePhotoUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return null;
  return <img src={url} alt={alt} className={className} loading={loading} />;
}
