import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import ImageUpload from "./ImageUpload";
import { useDeletePlayer, useUpsertPlayer } from "@/hooks/usePlayers";
import { POSITIONS, POSITIONS_FULL, PLAYER_STATUS_LABEL, type Player, type PlayerStatus } from "@/types";

const CUSTOM = "__custom__";

const STATUSES = Object.keys(PLAYER_STATUS_LABEL) as PlayerStatus[];

const empty = {
  name: "",
  jersey_number: "" as string,
  position: "",
  status: "starter" as PlayerStatus,
  photo_url: null as string | null,
};

export default function PlayerFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Player | null;
}) {
  const [form, setForm] = useState(empty);
  const [customPos, setCustomPos] = useState(false);
  const upsert = useUpsertPlayer();
  const del = useDeletePlayer();

  // โชว์ช่องพิมพ์เอง เมื่อเลือก "อื่นๆ" หรือค่าปัจจุบันไม่ใช่ตำแหน่งมาตรฐาน
  const showCustom = customPos || (!!form.position && !POSITIONS.includes(form.position as (typeof POSITIONS)[number]));

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              jersey_number: editing.jersey_number?.toString() ?? "",
              position: editing.position ?? "",
              status: editing.status,
              photo_url: editing.photo_url,
            }
          : empty
      );
      setCustomPos(false);
    }
  }, [open, editing]);

  async function save() {
    if (!form.name.trim()) return toast.error("กรุณากรอกชื่อผู้เล่น");
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        name: form.name.trim(),
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
        position: form.position.trim() || null,
        status: form.status,
        photo_url: form.photo_url,
      });
      toast.success(editing ? "แก้ไขผู้เล่นแล้ว" : "เพิ่มผู้เล่นแล้ว");
      onClose();
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm(`ลบผู้เล่น "${editing.name}" ?`)) return;
    try {
      await del.mutateAsync(editing.id);
      toast.success("ลบผู้เล่นแล้ว");
      onClose();
    } catch (e) {
      toast.error("ลบไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "แก้ไขผู้เล่น" : "เพิ่มผู้เล่น"}
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
        <div>
          <label className="label">รูปผู้เล่น</label>
          <ImageUpload
            value={form.photo_url}
            onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))}
            folder="players"
          />
        </div>

        <div>
          <label className="label">ชื่อ *</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ชื่อผู้เล่น"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">หมายเลขเสื้อ</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={form.jersey_number}
              onChange={(e) => setForm((f) => ({ ...f, jersey_number: e.target.value }))}
              placeholder="เช่น 10"
            />
          </div>
          <div>
            <label className="label">ตำแหน่ง</label>
            <select
              className="input"
              value={showCustom ? CUSTOM : form.position}
              onChange={(e) => {
                const v = e.target.value;
                if (v === CUSTOM) {
                  setCustomPos(true);
                  setForm((f) => ({ ...f, position: "" }));
                } else {
                  setCustomPos(false);
                  setForm((f) => ({ ...f, position: v }));
                }
              }}
            >
              <option value="">— ไม่ระบุ —</option>
              {POSITIONS_FULL.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.label}
                </option>
              ))}
              <option value={CUSTOM}>อื่นๆ (พิมพ์เอง)</option>
            </select>
            {showCustom && (
              <input
                className="input mt-2"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="เช่น CB, LB, ST, CAM"
                autoFocus
              />
            )}
          </div>
        </div>

        <div>
          <label className="label">สถานะ</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`chip ${form.status === s ? "chip-active" : ""}`}
              >
                {PLAYER_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
