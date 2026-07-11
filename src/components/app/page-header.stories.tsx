import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";

const meta = {
  title: "App/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  args: {
    title: "Timelines",
    description: "All the health journeys you are tracking.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <Button>
        <Plus className="size-4" />
        New timeline
      </Button>
    ),
  },
};

export const TitleOnly: Story = {
  args: { description: undefined },
};
