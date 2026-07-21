import { useRef, useState } from "react";
import { Upload, Link2, Loader2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/storage";

export default function ImageUpload({
  value,
  onChange,
  folder = "misc",
  shape = "circle",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  shape?: "circle" | "square";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      toast.error("อัปโหลดรูปไม่สำเร็จ", { description: String((e as Error).message) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] ${
          shape === "circle" ? "rounded-full" : "rounded-xl"
        }`}
      >
        {uploading ? (
          <Loader2 className="animate-spin text-[hsl(var(--text-muted))]" />
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="text-[hsl(var(--text-muted))]" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        {!urlMode ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => inputRef.current?.click()}>
              <Upload size={16} /> อัปโหลด
            </button>
            <button type="button" className="btn-ghost" onClick={() => setUrlMode(true)}>
              <Link2 size={16} /> ใส่ URL
            </button>
            {value && (
              <button type="button" className="btn-ghost" onClick={() => onChange(null)}>
                ลบรูป
              </button>
            )}
          </div>
        ) : (
          <input
            className="input"
            placeholder="วางลิงก์รูปภาพ (https://...)"
            defaultValue={value ?? ""}
            autoFocus
            onBlur={(e) => {
              onChange(e.target.value.trim() || null);
              setUrlMode(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
