import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const isPreview = process.env.VERCEL_ENV === "preview";

/** Endereço do Supabase deste projeto (login no navegador e fotos do Storage). */
function supabaseOrigin(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  try {
    return raw ? new URL(raw) : null;
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();
const supabaseHttp = supabase?.origin ?? "https://*.supabase.co";
const supabaseWs = supabase ? supabaseHttp.replace(/^http/, "ws") : "wss://*.supabase.co";

/**
 * Content-Security-Policy. Scripts só do próprio site; 'unsafe-inline' fica porque o
 * Next injeta scripts inline de hidratação e as páginas não usam nonce (precisaria
 * renderizar tudo por requisição pelo proxy). Fotos podem vir de qualquer https
 * (capa colada pelo admin), mas imagem não executa código.
 * As entradas vercel.live são da barra de comentários das prévias da Vercel.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${isPreview ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHttp} ${supabaseWs}${isPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// cacheComponents fica desligado no MVP: todas as páginas com dados são
// renderizadas por requisição, o que é mais simples de entender e depurar.
const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // O app usa <img> comum; esta lista vale só se alguém usar next/image. Fica
  // restrita ao avatar do Google e ao bucket de capas DESTE projeto, para o
  // otimizador não virar proxy de imagens de qualquer lugar (SSRF/custo).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      supabase
        ? {
            protocol: supabase.protocol.replace(":", "") as "http" | "https",
            hostname: supabase.hostname,
            ...(supabase.port ? { port: supabase.port } : {}),
            pathname: "/storage/v1/object/public/covers/**",
          }
        : { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/covers/**" },
    ],
  },
};

export default nextConfig;
