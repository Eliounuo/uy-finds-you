import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
  resolvePhotoUrls,
} from "@/lib/use-property-photos";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
};

async function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<File> {
  if (file.size <= 500 * 1024) return file;
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ImageUpload({ value, onChange, maxFiles = 10 }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const dragIndex = useRef<number | null>(null);

  // resolve preview URLs whenever value changes
  useEffect(() => {
    let alive = true;
    void resolvePhotoUrls(value).then((urls) => {
      if (alive) setPreviews(urls);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!user) {
        toast.error("Войдите, чтобы загрузить фото");
        return;
      }
      const arr = Array.from(files);
      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        toast.error(`Максимум ${maxFiles} фото`);
        return;
      }
      const slice = arr.slice(0, remaining);
      setBusy(true);
      const added: string[] = [];
      for (let i = 0; i < slice.length; i++) {
        const original = slice[i];
        setProgress((p) => ({ ...p, [i]: 10 }));
        try {
          const file = await compressImage(original);
          setProgress((p) => ({ ...p, [i]: 50 }));
          const path = await uploadPropertyPhoto(file, user.id);
          added.push(path);
          setProgress((p) => ({ ...p, [i]: 100 }));
        } catch (e) {
          toast.error(`${original.name}: не удалось загрузить`);
        }
      }
      if (added.length) onChange([...value, ...added]);
      setBusy(false);
      setTimeout(() => setProgress({}), 600);
    },
    [user, value, onChange, maxFiles],
  );

  const remove = (path: string) => {
    onChange(value.filter((p) => p !== path));
    deletePropertyPhoto(path).catch(() => {});
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:bg-muted/40"
        }`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <div className="text-sm font-medium">Перетащите фото или нажмите</div>
        <div className="text-[11px] text-muted-foreground">
          До {maxFiles} фото · автосжатие до 1200px
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {Object.keys(progress).length > 0 && (
        <div className="space-y-1">
          {Object.entries(progress).map(([k, v]) => (
            <div key={k} className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${v}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((path, i) => (
            <div
              key={path}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current != null) reorder(dragIndex.current, i);
                dragIndex.current = null;
              }}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border"
              style={{ height: 90 }}
            >
              {previews[i] && (
                <img src={previews[i]} alt="" className="h-full w-full object-cover" />
              )}
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                  Обложка
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(path)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Удалить фото"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <GripVertical className="h-3 w-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
