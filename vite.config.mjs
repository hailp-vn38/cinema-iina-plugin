import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const rootDir = process.cwd();
const sharedDir = resolve(rootDir, "src/shared");

export default defineConfig({
  root: resolve(rootDir, "ui"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": sharedDir,
    },
  },
  server: {
    fs: {
      allow: [rootDir],
    },
  },
  build: {
    outDir: resolve(rootDir, "dist/ui"),
    emptyOutDir: true,
  },
});
