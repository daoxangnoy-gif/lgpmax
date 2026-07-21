// สร้างไอคอน PNG จาก SVG (สำหรับ PWA/manifest/apple-touch)
// รัน: npm run gen:icons
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public");

const ball = (r, cx = 256, cy = 256) => `
  <g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="#ffffff"/>
    <g fill="#0f2e18">
      <path d="M0 ${-r} ${r * 0.29} ${-r * 0.79} ${r * 0.18} ${-r * 0.44}h${-r * 0.36}L${-r * 0.29} ${-r * 0.79}z"/>
    </g>
    <circle r="${r}" fill="none" stroke="#0f2e18" stroke-width="${r * 0.066}"/>
    <circle r="${r * 0.5}" fill="none" stroke="#0f2e18" stroke-width="${r * 0.05}" stroke-dasharray="${r * 0.16} ${r * 0.12}"/>
  </g>`;

// ไอคอนปกติ (มุมโค้ง) และ maskable (เต็มพื้นที่ + safe padding)
const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#15803d"/>${ball(150)}</svg>`;

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#15803d"/>${ball(120)}</svg>`;

const targets = [
  { svg: svgAny, size: 192, out: "pwa-192.png" },
  { svg: svgAny, size: 512, out: "pwa-512.png" },
  { svg: svgMaskable, size: 512, out: "pwa-maskable-512.png" },
  { svg: svgAny, size: 180, out: "apple-touch-icon.png" },
  { svg: svgAny, size: 32, out: "favicon-32.png" },
];

for (const t of targets) {
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(join(pub, t.out));
  console.log("✓", t.out);
}
console.log("เสร็จแล้ว — สร้างไอคอนใน public/");
