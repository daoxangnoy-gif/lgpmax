import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Pencil, MapPin, Trophy } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import { useMatches, useUpsertMatch } from "@/hooks/useMatches";
import { useAddStoryPhoto, useDeleteStoryPhoto, useStoryPhotos } from "@/hooks/useStory";
import { uploadImage } from "@/lib/storage";
import { formatMatchWhen, venueText } from "@/lib/format";
import type { Match, StoryPhoto } from "@/types";

export default function StoryPage() {
  const { data: matches = [], isLoading } = useMatches();

  return (
    <div>
      <AppHeader title="สตอรี่บอร์ด" subtitle="ฟีดทุกนัด — ล่าสุดอยู่บนสุด" />
      <EnvBanner />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {isLoading && (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>
        )}
        {!isLoading && matches.length === 0 && (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">
            ยังไม่มีนัด — สร้างนัดที่เมนู “นัดแข่ง” ก่อน
          </p>
        )}

        {/* ฟีดแบบเฟสบุก: ทุกนัดเรียงล่าสุดบนสุด (matches sort desc มาแล้ว) */}
        {matches.map((m) => (
          <MatchPost key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function MatchPost({ match }: { match: Match }) {
  const { data: photos = [] } = useStoryPhotos(match.id);
  const addPhoto = useAddStoryPhoto(match.id);
  const delPhoto = useDeleteStoryPhoto(match.id);
  const upsertMatch = useUpsertMatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editScore, setEditScore] = useState(false);
  const [us, setUs] = useState(match.score_us?.toString() ?? "");
  const [opp, setOpp] = useState(match.score_opponent?.toString() ?? "");

  useEffect(() => {
    setUs(match.score_us?.toString() ?? "");
    setOpp(match.score_opponent?.toString() ?? "");
  }, [match.score_us, match.score_opponent]);

  const hasScore = match.score_us != null || match.score_opponent != null;
  const opponentName = match.opponent || "คู่แข่ง";
  const initial = opponentName.trim().slice(0, 1).toUpperCase();

  // ผล แพ้/ชนะ/เสมอ (มุมทีมเรา)
  let result: { text: string; cls: string } | null = null;
  if (hasScore) {
    const a = match.score_us ?? 0;
    const b = match.score_opponent ?? 0;
    if (a > b) result = { text: "ชนะ", cls: "bg-emerald-500/20 text-emerald-400" };
    else if (a < b) result = { text: "แพ้", cls: "bg-red-500/20 text-red-400" };
    else result = { text: "เสมอ", cls: "bg-amber-500/20 text-amber-400" };
  }

  async function saveScore() {
    try {
      await upsertMatch.mutateAsync({
        id: match.id,
        score_us: us === "" ? null : Number(us),
        score_opponent: opp === "" ? null : Number(opp),
      });
      toast.success("บันทึกสกอร์แล้ว");
      setEditScore(false);
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  async function onFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, `story/${match.id}`);
        await addPhoto.mutateAsync({ photo_url: url });
      }
      toast.success("เพิ่มรูปแล้ว");
    } catch (e) {
      toast.error("อัปโหลดไม่สำเร็จ", { description: String((e as Error).message) });
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(photo: StoryPhoto) {
    if (!confirm("ลบรูปนี้?")) return;
    await delPhoto.mutateAsync(photo);
  }

  return (
    <article className="card overflow-hidden">
      {/* header โพสต์ */}
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-brand-fg">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">พบ {opponentName}</div>
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
            {formatMatchWhen(match)}
          </div>
        </div>
        {result && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${result.cls}`}>
            {result.text}
          </span>
        )}
      </div>

      {/* สนาม */}
      <div className="flex items-center gap-1 px-3 pb-2 text-xs text-[hsl(var(--text-muted))]">
        <MapPin size={13} /> {venueText(match)}
      </div>

      {/* สกอร์ */}
      <div className="mx-3 mb-3 rounded-xl bg-[hsl(var(--surface-2))] p-3">
        {!editScore ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-[hsl(var(--text-muted))]" />
              {hasScore ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[hsl(var(--text-muted))]">ทีมเรา</span>
                  <span className="text-2xl font-bold text-brand">{match.score_us ?? 0}</span>
                  <span className="text-lg text-[hsl(var(--text-muted))]">-</span>
                  <span className="text-2xl font-bold">{match.score_opponent ?? 0}</span>
                  <span className="text-sm text-[hsl(var(--text-muted))]">{opponentName}</span>
                </div>
              ) : (
                <span className="text-sm text-[hsl(var(--text-muted))]">ยังไม่มีผล</span>
              )}
            </div>
            <button
              className="rounded-lg p-1.5 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface))]"
              onClick={() => setEditScore(true)}
              aria-label="แก้สกอร์"
            >
              <Pencil size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="text-center">
              <div className="text-[10px] text-[hsl(var(--text-muted))]">ทีมเรา</div>
              <input
                className="input mt-1 w-14 text-center text-lg font-bold"
                type="number"
                inputMode="numeric"
                value={us}
                onChange={(e) => setUs(e.target.value)}
              />
            </div>
            <span className="pt-4 font-bold text-[hsl(var(--text-muted))]">-</span>
            <div className="text-center">
              <div className="max-w-16 truncate text-[10px] text-[hsl(var(--text-muted))]">
                {opponentName}
              </div>
              <input
                className="input mt-1 w-14 text-center text-lg font-bold"
                type="number"
                inputMode="numeric"
                value={opp}
                onChange={(e) => setOpp(e.target.value)}
              />
            </div>
            <button className="btn-brand ml-1 mt-4" onClick={saveScore} disabled={upsertMatch.isPending}>
              บันทึก
            </button>
          </div>
        )}
      </div>

      {/* อัลบั้มรูป */}
      {photos.length > 0 && (
        <div className={`grid gap-0.5 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
          {photos.map((ph) => (
            <div
              key={ph.id}
              className={`group relative overflow-hidden ${
                photos.length === 1 ? "aspect-video" : "aspect-square"
              }`}
            >
              <img src={ph.photo_url} alt={ph.caption ?? ""} className="h-full w-full object-cover" />
              <button
                onClick={() => onDelete(ph)}
                className="absolute right-1 top-1 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="ลบรูป"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* เพิ่มรูป */}
      <div className="p-3">
        <button
          className="btn-ghost w-full"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          เพิ่มรูปไฮไลต์
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </article>
  );
}
