import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components sengaja dimatikan dulu: auth + query DB di layout
  // jadi wajib dibungkus <Suspense>. Bisa dinyalakan lagi nanti kalau perlu.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
