import { FileText } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { renderWithProviders } from "@/test/render";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    const { getByRole, getByText } = renderWithProviders(
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload a file to get started."
      />,
    );

    expect(getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
    expect(getByText("Upload a file to get started.")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    const { getByRole } = renderWithProviders(
      <EmptyState
        icon={FileText}
        title="No documents yet"
        action={<Button type="button">Upload</Button>}
      />,
    );

    expect(getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });
});
