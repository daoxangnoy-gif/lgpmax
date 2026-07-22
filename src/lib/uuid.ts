// UUID ที่ทำงานได้ทั้ง secure context (https/localhost) และ non-secure (http LAN IP)
// crypto.randomUUID() ใช้ได้เฉพาะ secure context — ถ้าไม่มีให้ fallback
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") {
    try {
      return c.randomUUID();
    } catch {
      /* fall through */
    }
  }
  // fallback RFC4122 v4 (ใช้ getRandomValues ถ้ามี ไม่งั้น Math.random)
  const rand = (): number => {
    if (c && typeof c.getRandomValues === "function") {
      const a = new Uint8Array(1);
      c.getRandomValues(a);
      return a[0] / 256;
    }
    return Math.random();
  };
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = Math.floor(rand() * 16);
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
