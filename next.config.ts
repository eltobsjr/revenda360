import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Sobem package-lock.json soltos em pastas acima deste repo (duplicatas
  // da confusão de clone da máquina) confundem a detecção automática de
  // workspace root do Turbopack, que passa a resolver módulos a partir do
  // diretório errado e quebra o build (ver "Filesystem Root" nos docs do
  // Turbopack). Fixando aqui explicitamente para a raiz deste projeto.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
