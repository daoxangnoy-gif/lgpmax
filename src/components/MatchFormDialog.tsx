import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import { useUpsertMatch, useDeleteMatch } from "@/hooks/useMatches";
import { useEnsureVenue, useVenues } from "@/hooks/useVenues";
import type { Match } from "@/types";

const empty = {
  match_date: new Date().toISOString().slice(0, 10),
  match_time: "18:00",
  venue_name: "",
  opponent: "",
};

export default function MatchFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Match | null;
}) {
  const [form, setForm] = useState(empty);
  const { data: venues = [] } = useVenues();
  const upsert = useUpsertMatch();
  const del = useDeleteMatch();
  const ensureVenue = useEnsureVenue();

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              match_date: editing.match_date,
              match_time: editing.match_time?.slice(0, 5) ?? "",
              venue_name: editing.venue_name ?? "",
              opponent: editing.opponent ?? "",
            }
          : empty
      );
    }
  }, [open, editing]);

  async function save() {
    if (!form.match_date) return toast.error("กรุณาเลือกวันที่");
    try {
      const venue = form.venue_name.trim()
        ? await ensureVenue.mutateAsync(form.venue_name)
        : null;
      await upsert.mutateAsync({
        id: editing?.id,
        match_date: form.match_date,
        match_time: form.match_time || null,
        venue_id: venue?.id ?? null,
        venue_name: form.venue_name.trim() || null,
        opponent: form.opponent.trim() || null,
      });
      toast.success(editing ? "แก้ไขนัดแล้ว" : "สร้างนัดแล้ว");
      onClose();
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("ลบนัดนี้? (ข้อมูลลงทะเบียน/รูป/แผนที่ผูกไว้จะถูกลบด้วย)")) return;
    try {
      await del.mutateAsync(editing.id);
      toast.success("ลบนัดแล้ว");
      onClose();
    } catch (e) {
      toast.error("ลบไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "แก้ไขนัด" : "สร้างนัดใหม่"}
      footer={
        <>
          {editing && (
            <button className="btn-danger mr-auto" onClick={remove}>
              ลบ
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn-brand" onClick={save} disabled={upsert.isPending}>
            บันทึก
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">วันที่ *</label>
            <input
              className="input"
              type="date"
              value={form.match_date}
              onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">เวลา</label>
            <input
              className="input"
              type="time"
              value={form.match_time}
              onChange={(e) => setForm((f) => ({ ...f, match_time: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">สนาม</label>
          <input
            className="input"
            list="venue-list"
            value={form.venue_name}
            onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
            placeholder="พิมพ์ชื่อสนาม หรือเลือกจากที่เคยใช้"
          />
          <datalist id="venue-list">
            {venues.map((v) => (
              <option key={v.id} value={v.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label">ทีมคู่แข่ง</label>
          <input
            className="input"
            value={form.opponent}
            onChange={(e) => setForm((f) => ({ ...f, opponent: e.target.value }))}
            placeholder="ชื่อทีมคู่แข่ง"
          />
        </div>
      </div>
    </Modal>
  );
}
