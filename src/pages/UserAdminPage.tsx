import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { usePlayers } from "@/hooks/usePlayers";
import { useAuth } from "@/hooks/useAuth";
import {
  ACTIONS,
  EMPTY_PERMS,
  MENUS,
  type ActionKey,
  type MenuKey,
  type Perms,
  type Profile,
} from "@/lib/auth";

function mergePerms(p: Partial<Perms> | undefined): Perms {
  const out = structuredClone(EMPTY_PERMS);
  if (p) for (const m of MENUS) for (const a of ACTIONS) {
    if (p[m.key]?.[a.key]) out[m.key][a.key] = true;
  }
  return out;
}

export default function UserAdminPage() {
  const qc = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("ft_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const pending = profiles.filter((p) => p.status === "pending");
  const others = profiles.filter((p) => p.status !== "pending");

  return (
    <div>
      <AppHeader title="จัดการผู้ใช้" subtitle={`${profiles.length} บัญชี · รออนุมัติ ${pending.length}`} />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {isLoading && <p className="py-8 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>}

        {pending.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-amber-300">รออนุมัติ ({pending.length})</h3>
            <div className="space-y-3">
              {pending.map((p) => (
                <ProfileCard key={p.user_id} profile={p} onSaved={() => qc.invalidateQueries({ queryKey: ["profiles"] })} defaultOpen />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[hsl(var(--text-muted))]">ผู้ใช้ทั้งหมด</h3>
          <div className="space-y-3">
            {others.map((p) => (
              <ProfileCard key={p.user_id} profile={p} onSaved={() => qc.invalidateQueries({ queryKey: ["profiles"] })} />
            ))}
            {others.length === 0 && (
              <p className="text-sm text-[hsl(var(--text-muted))]">ยังไม่มีผู้ใช้ที่อนุมัติแล้ว</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  onSaved,
  defaultOpen = false,
}: {
  profile: Profile;
  onSaved: () => void;
  defaultOpen?: boolean;
}) {
  const { data: players = [] } = usePlayers();
  const { profile: me, refreshProfile } = useAuth();
  const [open, setOpen] = useState(defaultOpen);
  const [role, setRole] = useState<Profile["role"]>(profile.role);
  const [playerId, setPlayerId] = useState<string | null>(profile.player_id);
  const [perms, setPerms] = useState<Perms>(mergePerms(profile.perms));
  const [newPassword, setNewPassword] = useState("");
  const isSelf = me?.user_id === profile.user_id;

  const linkedName = useMemo(
    () => players.find((pl) => pl.id === profile.player_id)?.name,
    [players, profile.player_id]
  );

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase.from("ft_profiles").update(patch).eq("user_id", profile.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      onSaved();
      if (isSelf) refreshProfile();
    },
  });

  async function save(extra?: Partial<Profile>) {
    try {
      if (newPassword.trim()) {
        if (newPassword.length < 6) return toast.error("รหัสผ่านอย่างน้อย 6 ตัว");
        const { error } = await supabase.rpc("ft_admin_set_password", {
          _user_id: profile.user_id,
          _new_password: newPassword,
        });
        if (error) throw error;
        setNewPassword("");
      }
      await mutation.mutateAsync({ role, player_id: playerId, perms, ...extra });
      toast.success("บันทึกแล้ว");
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  async function approve() {
    if (!playerId) return toast.error("ต้องผูกนักเตะก่อนอนุมัติ");
    await save({ status: "approved" });
  }
  async function reject() {
    await save({ status: "rejected" });
  }

  const statusColor =
    profile.status === "approved"
      ? "bg-emerald-500/20 text-emerald-400"
      : profile.status === "rejected"
        ? "bg-red-500/20 text-red-400"
        : "bg-amber-500/20 text-amber-400";
  const statusText =
    profile.status === "approved" ? "อนุมัติแล้ว" : profile.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ";

  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--surface-2))]">
          {profile.role === "admin" ? <ShieldCheck size={18} className="text-brand" /> : <UserRound size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {profile.display_name || profile.username}
            {isSelf && <span className="ml-1 text-xs text-[hsl(var(--text-muted))]">(คุณ)</span>}
          </div>
          <div className="truncate text-xs text-[hsl(var(--text-muted))]">
            @{profile.username}
            {linkedName ? ` · นักเตะ: ${linkedName}` : " · ยังไม่ผูกนักเตะ"}
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>{statusText}</span>
        <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-[hsl(var(--border))] p-3">
          {/* ผูกนักเตะ */}
          <div>
            <label className="label">ผูกกับนักเตะ</label>
            <select className="input" value={playerId ?? ""} onChange={(e) => setPlayerId(e.target.value || null)}>
              <option value="">— ยังไม่ผูก —</option>
              {players.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.jersey_number != null ? `#${pl.jersey_number} ` : ""}
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          {/* role */}
          <div>
            <label className="label">บทบาท</label>
            <div className="flex gap-2">
              {(["member", "admin"] as const).map((r) => (
                <button
                  key={r}
                  className={`chip ${role === r ? "chip-active" : ""}`}
                  onClick={() => setRole(r)}
                  disabled={isSelf && r === "member"}
                >
                  {r === "admin" ? "แอดมิน" : "สมาชิก"}
                </button>
              ))}
            </div>
            {role === "admin" && (
              <p className="mt-1 text-[11px] text-[hsl(var(--text-muted))]">แอดมินมีสิทธิ์ทุกเมนูอัตโนมัติ</p>
            )}
          </div>

          {/* permission matrix */}
          {role !== "admin" && (
            <div>
              <label className="label">สิทธิ์แต่ละเมนู</label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-[hsl(var(--text-muted))]">
                      <th className="py-1 text-left font-normal">เมนู</th>
                      {ACTIONS.map((a) => (
                        <th key={a.key} className="py-1 text-center font-normal">{a.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MENUS.map((m) => (
                      <tr key={m.key} className="border-t border-[hsl(var(--border))]">
                        <td className="py-1.5">{m.label}</td>
                        {ACTIONS.map((a) => (
                          <td key={a.key} className="py-1.5 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[hsl(var(--brand))]"
                              checked={perms[m.key][a.key]}
                              onChange={(e) =>
                                setPerms((prev) => ({
                                  ...prev,
                                  [m.key]: { ...prev[m.key], [a.key as ActionKey]: e.target.checked },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* เปลี่ยนรหัสผ่าน */}
          <div>
            <label className="label">เปลี่ยนรหัสผ่าน (เว้นว่าง = ไม่เปลี่ยน)</label>
            <input
              className="input"
              type="text"
              value={newPassword}
              autoComplete="off"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
            />
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            {profile.status === "pending" && (
              <>
                <button className="btn-brand" onClick={approve} disabled={mutation.isPending}>
                  <Check size={16} /> อนุมัติ
                </button>
                <button className="btn-danger" onClick={reject} disabled={mutation.isPending}>
                  <X size={16} /> ปฏิเสธ
                </button>
              </>
            )}
            <button className="btn-ghost ml-auto" onClick={() => save()} disabled={mutation.isPending}>
              <Save size={16} /> บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
