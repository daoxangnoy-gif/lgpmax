import type { Config } from "tailwindcss";

// โทนสีทีมปรับได้ที่นี่ (และที่ src/index.css ตัวแปร --brand-*)
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "hsl(var(--brand))",
          fg: "hsl(var(--brand-fg))",
          dark: "hsl(var(--brand-dark))",
        },
        silver: "hsl(var(--silver))",
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
