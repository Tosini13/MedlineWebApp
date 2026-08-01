import { describe, expect, it } from "vitest";
import { activeLineIdFromPath, eventCountFromRelation } from "./line-event-count";

describe("eventCountFromRelation", () => {
  it("reads the nested supabase count payload", () => {
    expect(eventCountFromRelation([{ count: 4 }])).toBe(4);
  });

  it("defaults to 0 for missing or empty relations", () => {
    expect(eventCountFromRelation(null)).toBe(0);
    expect(eventCountFromRelation(undefined)).toBe(0);
    expect(eventCountFromRelation([])).toBe(0);
  });
});

describe("activeLineIdFromPath", () => {
  it("extracts the timeline id from a detail path", () => {
    expect(activeLineIdFromPath("/lines/abc-123")).toBe("abc-123");
    expect(activeLineIdFromPath("/lines/abc-123/events/evt-1")).toBe("abc-123");
    expect(activeLineIdFromPath("/lines/abc-123/edit")).toBe("abc-123");
  });

  it("ignores the create route and non-timeline paths", () => {
    expect(activeLineIdFromPath("/lines/new")).toBeNull();
    expect(activeLineIdFromPath("/")).toBeNull();
    expect(activeLineIdFromPath("/search")).toBeNull();
  });
});
