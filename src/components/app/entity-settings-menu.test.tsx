import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { EntitySettingsMenu } from "./entity-settings-menu";

describe("EntitySettingsMenu", () => {
  it("shows a settings trigger without exposing edit or delete by default", () => {
    const { getByRole, queryByRole } = renderWithProviders(
      <EntitySettingsMenu
        ariaLabel="Timeline settings"
        editItem={<a href="/edit">Edit</a>}
        deleteTitle="Delete this timeline?"
        deleteDescription="This permanently deletes the timeline."
        onDelete={() => undefined}
      />,
    );

    expect(getByRole("button", { name: "Timeline settings" })).toBeInTheDocument();
    expect(queryByRole("menuitem", { name: /edit/i })).not.toBeInTheDocument();
    expect(queryByRole("menuitem", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("reveals edit and delete options when the settings menu is opened", async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(
      <EntitySettingsMenu
        ariaLabel="Event settings"
        editItem={<a href="/edit">Edit</a>}
        deleteTitle="Delete this event?"
        deleteDescription="This permanently deletes the event."
        onDelete={() => undefined}
      />,
    );

    await user.click(getByRole("button", { name: "Event settings" }));

    expect(getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
    expect(getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onDelete after confirming destructive action", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const { getByRole } = renderWithProviders(
      <EntitySettingsMenu
        ariaLabel="Event settings"
        editItem={<a href="/edit">Edit</a>}
        deleteTitle="Delete this event?"
        deleteDescription="This permanently deletes the event."
        onDelete={onDelete}
      />,
    );

    await user.click(getByRole("button", { name: "Event settings" }));
    await user.click(getByRole("menuitem", { name: /delete/i }));
    await user.click(getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
