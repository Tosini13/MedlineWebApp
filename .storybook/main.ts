import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
  // `react-docgen-typescript` is incompatible with TypeScript 7.x's rewritten
  // compiler API, so use the faster Babel-based `react-docgen` extractor.
  typescript: {
    reactDocgen: "react-docgen",
  },
};

export default config;
