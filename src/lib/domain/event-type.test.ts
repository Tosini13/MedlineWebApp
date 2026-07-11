import { describe, expect, it } from "vitest";
import { EVENT_TYPE_CODES, EVENT_TYPE_OPTIONS, eventTypeMeta } from "./event-type";

describe("event-type metadata", () => {
  it("exposes metadata for every code", () => {
    for (const code of EVENT_TYPE_CODES) {
      const meta = eventTypeMeta(code);
      expect(meta.code).toBe(code);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.colorVar).toContain("var(");
    }
  });

  it("builds one option per code", () => {
    expect(EVENT_TYPE_OPTIONS).toHaveLength(EVENT_TYPE_CODES.length);
  });
});
