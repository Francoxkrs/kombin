import type { NextConfig } from "next";

// cacheComponents fica desligado no MVP: todas as páginas com dados são
// renderizadas por requisição, o que é mais simples de entender e depurar.
const nextConfig: NextConfig = {
  // Fotos do painel do restaurante: o navegador reduz antes (~150-260 KB) e o servidor
  // recusa acima de 2 MB; o limite daqui é essa foto mais a margem do multipart.
  experimental: {
    serverActions: { bodySizeLimit: "3mb" },
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
