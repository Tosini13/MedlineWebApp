import type { Meta, StoryObj } from "@storybook/react-vite";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "App/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    icon: FolderPlus,
    title: "No timelines yet",
    description: "Create your first timeline to start tracking appointments, tests and documents.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button>Create timeline</Button>,
  },
};

export const TitleOnly: Story = {
  args: {
    description: undefined,
  },
};
