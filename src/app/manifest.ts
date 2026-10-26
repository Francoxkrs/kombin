import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kombin",
    short_name: "Kombin",
    description: "Lugares que combinam com você.",
    start_url: "/",
    display: "standalone",
    background_color: "#2a1b12",
    theme_color: "#2a1b12",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
