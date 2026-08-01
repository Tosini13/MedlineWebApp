import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Line } from "@/lib/domain/types";
import { renderWithProviders } from "@/test/render";
import { TimelinesNav } from "./timelines-nav";

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      onClick,
      className,
      ...rest
    }: {
      to: string;
      params?: Record<string, string>;
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
      activeOptions?: unknown;
      activeProps?: unknown;
    }) => {
      const href =
        typeof to === "string"
          ? to.replace(/\$(\w+)/g, (_, key: string) => params?.[key] ?? "")
          : "#";
      return (
        <a href={href} onClick={onClick} className={className} {...rest}>
          {children}
        </a>
      );
    },
  };
});

function line(partial: Partial<Line> & Pick<Line, "id" | "title">): Line {
  return {
    ownerId: "user-1",
    description: null,
    color: "#336699",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    eventCount: 0,
    ...partial,
  };
}

const lines = [
  line({ id: "line-1", title: "Cardiology", color: "#ff0000", eventCount: 3 }),
  line({ id: "line-2", title: "Dental", color: "#00ff00", eventCount: 1 }),
];

describe("TimelinesNav", () => {
  it("toggles timeline sub-items with the fold button", async () => {
    const user = userEvent.setup();
    const { getByRole, queryByRole } = renderWithProviders(
      <TimelinesNav lines={lines} activeLineId={null} />,
    );

    expect(getByRole("link", { name: /Cardiology/i })).toBeInTheDocument();

    await user.click(getByRole("button", { name: /collapse timelines/i }));
    expect(queryByRole("link", { name: /Cardiology/i })).not.toBeInTheDocument();

    await user.click(getByRole("button", { name: /expand timelines/i }));
    expect(getByRole("link", { name: /Cardiology/i })).toBeInTheDocument();
  });

  it("shows event counts and marks the active timeline", () => {
    const { getByRole } = renderWithProviders(<TimelinesNav lines={lines} activeLineId="line-1" />);

    expect(getByRole("link", { name: /Cardiology/i })).toHaveAttribute("aria-current", "page");
    expect(getByRole("link", { name: /Cardiology/i })).toHaveTextContent("3");
    expect(getByRole("link", { name: /Dental/i })).toHaveTextContent("1");
  });

  it("animates a search field over the title and filters sub-items", async () => {
    const user = userEvent.setup();
    const { getByRole, queryByRole, getByText } = renderWithProviders(
      <TimelinesNav lines={lines} activeLineId={null} />,
    );

    expect(getByText("Timelines")).toBeInTheDocument();

    await user.click(getByRole("button", { name: /search timelines/i }));
    const input = getByRole("textbox", { name: /search timelines/i });
    expect(input).toBeInTheDocument();
    expect(getByText("Timelines").className).toMatch(/opacity-0/);

    await user.type(input, "dent");
    expect(getByRole("link", { name: /Dental/i })).toBeInTheDocument();
    expect(queryByRole("link", { name: /Cardiology/i })).not.toBeInTheDocument();
  });
});
