import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/** On Vercel, Nitro must emit the Build Output API (`.vercel/output`), not `node-server`. */
const nitroPreset = process.env.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: nitroPreset }),
    // React's Vite plugin must come after Start's plugin.
    viteReact(),
  ],
});
