import type { Meta, StoryObj } from "@storybook/react-vite";
import { EVENT_TYPE_CODES } from "@/lib/domain/event-type";
import { EventTypeBadge } from "./event-type-badge";

const meta = {
  title: "Events/EventTypeBadge",
  component: EventTypeBadge,
  tags: ["autodocs"],
  argTypes: {
    code: { control: "select", options: EVENT_TYPE_CODES },
  },
  args: { code: "MA" },
} satisfies Meta<typeof EventTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Appointment: Story = { args: { code: "MA" } };
export const Occurrence: Story = { args: { code: "O" } };
export const Test: Story = { args: { code: "MT" } };
export const Surgery: Story = { args: { code: "S" } };
export const Other: Story = { args: { code: "other" } };

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {EVENT_TYPE_CODES.map((code) => (
        <EventTypeBadge key={code} code={code} />
      ))}
    </div>
  ),
};
