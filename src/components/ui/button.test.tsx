import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Button } from "./button";

describe("Button", () => {
  it("renders a labelled button", () => {
    const { getByRole } = renderWithProviders(<Button>Save</Button>);
    expect(getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("invokes onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { getByRole } = renderWithProviders(<Button onClick={onClick}>Save</Button>);

    await user.click(getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
