import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Renderer (React) build config. Output goes to /dist, which Electron loads in
// production. Relative base so the packaged app can load assets from file://.
export default defineConfig({
  root: ".",
  base: "./",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
  // Self-contained: don't inherit the parent repo's PostCSS/Tailwind config.
  css: { postcss: { plugins: [] } },
});
