# FootyTeam ⚽ — แอปจัดการทีมฟุตบอลสมัครเล่น

PWA (React + Vite + Tailwind + Supabase) สำหรับจัดการทีมฟุตบอลสมัครเล่น
เปิดใช้บนเว็บ / ติดตั้งบนมือถือเหมือนแอป / เตรียม wrap เป็น APK ได้

## ฟีเจอร์ (v1)
- **ผู้เล่น** — เพิ่ม/แก้/ลบ, รูป, เบอร์เสื้อ, ตำแหน่ง, สถานะ (พร้อม/บาดเจ็บ/ไม่สะดวก/พักทีม), ค้นหา/กรอง
- **นัดแข่ง** — สร้างนัด (วันที่/เวลา/สนาม/คู่แข่ง), venue เลือกซ้ำได้, ลงทะเบียนมา/ไม่มา, สรุปคนมา
- **สตอรี่บอร์ด** — อัลบั้มรูปต่อนัด + สกอร์ + timeline ตามวันที่
- **แผนการเล่น** — ลากผู้เล่นวางในสนาม (touch ได้), preset 4-4-2/4-3-3 ฯลฯ, บันทึกใช้ซ้ำ, ผูกกับนัด

---

## เริ่มใช้งาน

### 1) สร้าง Supabase project
1. ไปที่ https://supabase.com → New project
2. เปิด **SQL Editor** → วางไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ทั้งไฟล์ → **Run**
   (สร้างตาราง + RLS + bucket รูปภาพ `photos`)
3. ไปที่ **Project Settings → API** คัดลอก `Project URL` และ `anon public key`

### 2) ตั้งค่า env
```bash
cp .env.example .env
# แก้ .env ใส่ค่าจริง
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

### 3) ติดตั้ง + รัน
```bash
npm install
npm run gen:icons   # สร้างไอคอน PWA (ทำครั้งเดียว)
npm run dev         # http://localhost:5180
```

> ถ้ายังไม่ใส่ `.env` แอปจะเปิดดู UI ได้ แต่การบันทึกข้อมูลจะยังไม่ทำงาน (มี banner เตือน)

---

## ติดตั้งเป็นแอปบนมือถือ (PWA)
- เปิดลิงก์เว็บบนมือถือ → เมนู **Add to Home Screen**
- เปิดจากไอคอน จะเต็มจอ ไม่มีแถบ URL (standalone) มี bottom nav แบบแอป

## แปลงเป็น APK (ทำภายหลัง)
โปรเจกต์เป็น PWA พร้อม wrap อยู่แล้ว เลือกทางใดทางหนึ่ง:
- **PWABuilder** (ง่ายสุด): `npm run build` → deploy → เอา URL ไปที่ https://pwabuilder.com → Generate APK
- **Capacitor** (ยืดหยุ่น): `npm i @capacitor/core @capacitor/cli @capacitor/android` →
  `npx cap init` → `npx cap add android` → `npm run build && npx cap sync` → build APK ใน Android Studio

---

## Scripts
| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | dev server (port 5180) |
| `npm run build` | production build → `dist/` |
| `npm run gen:icons` | สร้างไอคอน PWA ลง `public/` |
| `npm run preview` | ดู build ที่ compile แล้ว |

## โครงสร้างข้อมูล
ตารางขึ้นต้นด้วย prefix `ft_` (กันชนเมื่ออยู่ใน db เดียวกับแอปอื่น):
`ft_players` · `ft_venues` · `ft_matches` · `ft_match_registrations` · `ft_story_photos` · `ft_formations`
รูปภาพเก็บใน Supabase Storage bucket `ft_photos` (เก็บเฉพาะ URL ใน DB)

## Roadmap (เฟส 2)
Login + role admin/สมาชิก · สถิติผู้เล่นสะสม · แจ้งเตือนก่อนนัด · หารค่าใช้จ่าย · ปฏิทินรวมนัด ·
โหวต MVP · export สรุปนัดเป็นรูป/PDF · ประวัติคู่แข่งประจำ · build APK ด้วย Capacitor
