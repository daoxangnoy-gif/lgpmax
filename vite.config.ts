import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// base: "/" ใช้งานได้ทั้งเปิดตรง ๆ และ wrap เป็น APK
// ถ้า deploy ใต้ subpath (เช่น GitHub Pages /repo/) ให้เปลี่ยน base เป็น "/<repo>/"
export default defineConfig({
  base: "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5180, host: true },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png", "logo.png"],
      manifest: {
        name: "LLGP Football Club — LGP MAX",
        short_name: "LGP MAX",
        description: "แอปจัดการทีมฟุตบอล LGP MAX: ผู้เล่น นัดแข่ง สตอรี่บอร์ด แผนการเล่น",
        lang: "th",
        theme_color: "#1e3a8a",
        background_color: "#0a0f1e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            // cache รูปจาก Supabase Storage แบบ stale-while-revalidate
            urlPattern: ({ url }) => url.pathname.includes("/storage/v1/object/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
