// สร้างไอคอน PWA/favicon/apple-touch จากโลโก้ทีม public/logo.png
// รัน: npm run gen:icons
import sharp from "sharp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public");
const SRC = join(pub, "logo.png");

if (!existsSync(SRC)) {
  console.error("ไม่พบ public/logo.png — วางไฟล์โลโก้ก่อนแล้วรันใหม่");
  process.exit(1);
}

// พื้นหลังน้ำเงินเข้ม (โทนแอป) — โลโก้เป็นวงกลมจะลอยเด่นบนพื้นนี้
const BG = { r: 0x0a, g: 0x0f, b: 0x1e, alpha: 1 };

// วางโลโก้ตรงกลางบนพื้นสี่เหลี่ยม ตาม scale (สัดส่วนของด้าน)
async function make(size, scale, out, bg = BG) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(pub, out));
  console.log("✓", out);
}

// any: โลโก้เต็มเกือบขอบ | maskable: เผื่อ safe zone (~72%) กัน mask ตัดวงกลม
await make(192, 0.94, "pwa-192.png");
await make(512, 0.94, "pwa-512.png");
await make(512, 0.72, "pwa-maskable-512.png");
await make(180, 0.94, "apple-touch-icon.png");
await make(32, 1.0, "favicon-32.png");

console.log("เสร็จแล้ว — สร้างไอคอนจากโลโก้ LGP MAX ใน public/");
