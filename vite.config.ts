import { defineConfig } from "vite";

// Relative asset paths, so the same build works served at "/" (local preview) and
// under "/Qupi/" (GitHub Pages) without a base mismatch.
export default defineConfig({
  base: "./",
});
