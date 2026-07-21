import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import { useMatches, useUpsertMatch } from "@/hooks/useMatches";
import { useAddStoryPhoto, useDeleteStoryPhoto, useStoryPhotos } from "@/hooks/useStory";
import { uploadImage } from "@/lib/storage";
import { formatThaiDate } from "@/lib/format";
import type { Match, StoryPhoto } from "@/types";

export default function StoryPage() {
  const { data: matches = [] } = useMatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && matches.length) setSelectedId(matches[0].id);
  }, [matches, selectedId]);

  const selected = matches.find((m) => m.id === selectedId) ?? null;

  return (
    <div>
      <AppHeader title="สตอรี่บอร์ด" subtitle="อัลบั้ม + สกอร์ ของแต่ละนัด" />
      <EnvBanner />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {matches.length === 0 ? (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">
            ยังไม่มีนัด — สร้างนัดที่เมนู “นัดแข่ง” ก่อน
          </p>
        ) : (
          <>
            {/* timeline เลือกนัด */}
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`chip flex-col !items-start gap-0 !rounded-2xl px-3 py-2 text-left ${
                    selectedId === m.id ? "chip-active" : ""
                  }`}
                >
                  <span className="text-[11px] opacity-80">{formatThaiDate(m.match_date)}</span>
                  <span className="text-sm font-medium">{m.opponent || "คู่แข่ง?"}</span>
                </button>
              ))}
            </div>

            {selected && <MatchStory key={selected.id} match={selected} />}
          </>
        )}
      </div>
    </div>
  );
}

function MatchStory({ match }: { match: Match }) {
  const { data: photos = [] } = useStoryPhotos(match.id);
  const addPhoto = useAddStoryPhoto(match.id);
  const delPhoto = useDeleteStoryPhoto(match.id);
  const upsertMatch = useUpsertMatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [us, setUs] = useState(match.score_us?.toString() ?? "");
  const [opp, setOpp] = useState(match.score_opponent?.toString() ?? "");

  useEffect(() => {
    setUs(match.score_us?.toString() ?? "");
    setOpp(match.score_opponent?.toString() ?? "");
  }, [match.id, match.score_us, match.score_opponent]);

  async function saveScore() {
    try {
      await upsertMatch.mutateAsync({
        id: match.id,
        score_us: us === "" ? null : Number(us),
        score_opponent: opp === "" ? null : Number(opp),
      });
      toast.success("บันทึกสกอร์แล้ว");
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
    <div className="space-y-4">
      {/* สกอร์ */}
      <div className="card p-4">
        <div className="mb-2 text-xs font-medium text-[hsl(var(--text-muted))]">สกอร์</div>
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-[11px] text-[hsl(var(--text-muted))]">ทีมเรา</div>
            <input
              className="input mt-1 w-16 text-center text-xl font-bold"
              type="number"
              inputMode="numeric"
              value={us}
              onChange={(e) => setUs(e.target.value)}
            />
          </div>
          <span className="pt-4 text-xl font-bold text-[hsl(var(--text-muted))]">-</span>
          <div className="text-center">
            <div className="text-[11px] text-[hsl(var(--text-muted))]">
              {match.opponent || "คู่แข่ง"}
            </div>
            <input
              className="input mt-1 w-16 text-center text-xl font-bold"
              type="number"
              inputMode="numeric"
              value={opp}
              onChange={(e) => setOpp(e.target.value)}
            />
          </div>
          <button className="btn-brand ml-2 mt-4" onClick={saveScore} disabled={upsertMatch.isPending}>
            <Save size={16} /> บันทึก
          </button>
        </div>
      </div>

      {/* อัลบั้ม */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">อัลบั้ม ({photos.length})</h3>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          เพิ่มรูป
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

      {photos.length === 0 ? (
        <p className="py-6 text-center text-sm text-[hsl(var(--text-muted))]">
          ยังไม่มีรูป — กด “เพิ่มรูป”
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((ph) => (
            <div key={ph.id} className="group relative aspect-square overflow-hidden rounded-xl">
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
    </div>
  );
}
