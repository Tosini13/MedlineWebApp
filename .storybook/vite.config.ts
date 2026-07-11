import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/**
 * Dedicated Vite config for Storybook. It deliberately omits the TanStack Start
 * plugin (which sets up SSR-only environments and server-fn extraction) and only
 * wires Tailwind v4 plus path-alias resolution. `@storybook/react-vite` adds the
 * React plugin automatically.
 */
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { tsconfigPaths: true },
});
