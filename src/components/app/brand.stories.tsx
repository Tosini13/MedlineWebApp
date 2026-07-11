import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brand } from "./brand";

const meta = {
  title: "App/Brand",
  component: Brand,
  tags: ["autodocs"],
  args: { showWordmark: true },
} satisfies Meta<typeof Brand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithWordmark: Story = {};

export const IconOnly: Story = { args: { showWordmark: false } };
