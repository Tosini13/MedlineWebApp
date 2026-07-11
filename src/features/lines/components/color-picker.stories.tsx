import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ColorPicker, DEFAULT_LINE_COLOR } from "./color-picker";

const meta = {
  title: "Lines/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { value: DEFAULT_LINE_COLOR, onChange: () => {} },
  render: () => {
    const [value, setValue] = useState<string>(DEFAULT_LINE_COLOR);
    return (
      <div className="space-y-4">
        <ColorPicker value={value} onChange={setValue} />
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-mono">{value}</span>
        </p>
      </div>
    );
  },
};
