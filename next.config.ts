import type { NextConfig } from "next";
import path from "node:path";

const CSP = [
  "default-src 'self'",
  // BRAND_INIT_SCRIPT (app/layout.tsx) é inline por design (evita FOUC de tema
  // antes da hidratação) e o Next injeta estilo inline em dev/build — sem
  // nonce por enquanto, então precisa de 'unsafe-inline'. 'unsafe-eval' só em
  // dev — o React dev mode usa eval() pra debugging, mas nunca em produção.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Sobem package-lock.json soltos em pastas acima deste repo (duplicatas
  // da confusão de clone da máquina) confundem a detecção automática de
  // workspace root do Turbopack, que passa a resolver módulos a partir do
  // diretório errado e quebra o build (ver "Filesystem Root" nos docs do
  // Turbopack). Fixando aqui explicitamente para a raiz deste projeto.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
