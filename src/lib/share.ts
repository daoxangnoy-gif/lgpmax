import { toast } from "sonner";

/**
 * แชร์ลิงก์แบบทนทาน:
 * - มือถือที่รองรับ → เปิด share sheet ของระบบ (ส่งเข้า LINE ฯลฯ)
 * - เดสก์ท็อป / ไม่รองรับ / share พัง → คัดลอกลิงก์ลง clipboard แทน
 * (navigator.share บนเดสก์ท็อปมักพัง "Try that again" จึงไม่ใช้)
 */
export async function shareLink(opts: { title?: string; text?: string; url: string }) {
  const { title, text, url } = opts;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) {
      // ผู้ใช้กดยกเลิก → เงียบ, อย่างอื่น → ตกไป copy
      if ((e as Error)?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แล้ว — วางส่งในแอปอื่นได้เลย");
  } catch {
    window.prompt("คัดลอกลิงก์นี้:", url);
  }
}
