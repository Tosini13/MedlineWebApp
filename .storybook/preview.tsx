import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/styles/app.css";

/** Applies the selected theme by toggling the `dark` class on <html>. */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as "light" | "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="bg-background text-foreground min-h-svh p-6">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
