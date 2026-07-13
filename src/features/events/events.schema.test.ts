import { describe, expect, it } from "vitest";
import { createEventSchema } from "./events.schema";

describe("createEventSchema", () => {
  it("normalizes an empty description to null", () => {
    const parsed = createEventSchema.parse({
      lineId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Checkup",
      date: "2026-03-14T09:00:00.000Z",
      description: "",
      type: "MA",
    });
    expect(parsed.description).toBeNull();
  });

  it("rejects an unknown event type", () => {
    expect(() =>
      createEventSchema.parse({
        lineId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Checkup",
        date: "2026-03-14T09:00:00.000Z",
        type: "appointment",
      }),
    ).toThrow();
  });

  it("rejects an unparseable date string", () => {
    expect(() =>
      createEventSchema.parse({
        lineId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Checkup",
        date: "not-a-date",
        type: "MA",
      }),
    ).toThrow(/valid date/);
  });
});
