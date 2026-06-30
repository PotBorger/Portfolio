import { defineConfig } from "vite";

// Served from a custom domain (CNAME: nolan-mai.is-a.dev) at the root,
// so the public base path stays "/".
export default defineConfig({
  base: "/",
  build: {
    target: "es2020",
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Split the Three.js runtime into its own chunk so the rest of the
        // app (and the static fallback) stay light and cacheable.
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
