import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "coscheck | Agenda acara cosplay Indonesia",
    short_name: "coscheck",
    description: "Direktori acara cosplay Indonesia dengan info yang rutin dicek.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfbfa",
    theme_color: "#d94111",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}