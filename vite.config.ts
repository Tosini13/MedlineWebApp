import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

/** On Vercel, Nitro must emit the Build Output API (`.vercel/output`), not `node-server`. */
const nitroPreset = process.env.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    // Keep firebase-admin out of the SSR bundle; Nitro traces the real package instead.
    external: ["firebase-admin"],
  },
  plugins: [
    svgr(),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: nitroPreset,
      // firebase-admin breaks when bundled (SDK_VERSION runtime error on Vercel).
      // Full-trace copies the package tree into the serverless function output.
      traceDeps: ["firebase-admin*", "@google-cloud/*", "@grpc/*"],
    }),
    // React's Vite plugin must come after Start's plugin.
    viteReact(),
  ],
});
