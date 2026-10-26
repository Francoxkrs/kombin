import type { NextConfig } from "next";

// cacheComponents fica desligado no MVP: todas as páginas com dados são
// renderizadas por requisição, o que é mais simples de entender e depurar.
const nextConfig: NextConfig = {
  // Foto de capa enviada pelo painel do restaurante (até 4 MB + margem do multipart).
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
