// identity แบบต่อเครื่อง (v1 ยังไม่มี login) — เก็บใน localStorage
// เฟส 2 ค่อยผูกกับ Supabase Auth user จริง

const ID_KEY = "ft_device_id";
const NAME_KEY = "ft_display_name";

export function getDeviceId(): string {
  let v = localStorage.getItem(ID_KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(ID_KEY, v);
  }
  return v;
}

export function getDisplayName(): string {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function setDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim());
}
