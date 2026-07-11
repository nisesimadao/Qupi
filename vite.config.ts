import { defineConfig } from "vite";

// Served from GitHub Pages at nisesimadao.github.io/Qupi/, so assets resolve
// under /Qupi/. `npm run dev` overrides this to "/" automatically in serve mode.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Qupi/" : "/",
}));
