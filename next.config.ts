// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const disablePwa =
  process.env.NEXT_ENABLE_PWA !== "true" ||
  process.env.NODE_ENV === "development";

const withPWAConfig = withPWA({
  dest: "public", // 📦 génère le service worker et manifest ici
  register: true, // auto-enregistrement du SW
  skipWaiting: true, // active la nouvelle version sans rechargement
  disable: disablePwa,
});

export const experimental = {
  optimizeCss: true,
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // autorise les images Supabase
      },
    ],
  },
};

// 🧩 export combiné (Next.js + PWA)
// @ts-expect-error type conflict between next-pwa and Next 15
export default withPWAConfig(nextConfig);
