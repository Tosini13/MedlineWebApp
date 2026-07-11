import { describe, expect, it } from "vitest";
import { createLineSchema, lineFormSchema } from "./lines.schema";

describe("lineFormSchema", () => {
  it("keeps an optional description as undefined (form input === output)", () => {
    const parsed = lineFormSchema.parse({ title: "Cardiology", color: "#0E7C86" });
    expect(parsed.description).toBeUndefined();
  });

  it("rejects an invalid color", () => {
    expect(() => lineFormSchema.parse({ title: "X", color: "teal" })).toThrow();
  });

  it("requires a non-empty title", () => {
    expect(() => lineFormSchema.parse({ title: "   ", color: "#0E7C86" })).toThrow();
  });
});

describe("createLineSchema", () => {
  it("normalizes an empty description to null", () => {
    const parsed = createLineSchema.parse({ title: "X", description: "", color: "#0E7C86" });
    expect(parsed.description).toBeNull();
  });

  it("keeps a real description", () => {
    const parsed = createLineSchema.parse({
      title: "X",
      description: "notes",
      color: "#0E7C86",
    });
    expect(parsed.description).toBe("notes");
  });
});
