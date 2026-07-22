import { supabase } from "./supabase";
import { uuid } from "./uuid";

const BUCKET = "ft_photos";

/** อัปโหลดไฟล์รูปขึ้น Supabase Storage แล้วคืน public URL */
export async function uploadImage(file: File, folder = "misc"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${uuid()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** ลบรูปออกจาก Storage จาก public URL (best-effort, ไม่ throw ถ้าลบไม่ได้) */
export async function deleteImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]).catch(() => void 0);
}
