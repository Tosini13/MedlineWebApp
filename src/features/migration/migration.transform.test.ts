import { describe, expect, it } from "vitest";
import { normalizeColor, normalizeEventDate, normalizeEventType } from "./migration.transform";

describe("normalizeColor", () => {
  it("keeps valid 6-digit hex colors", () => {
    expect(normalizeColor("#0E7C86")).toBe("#0E7C86");
    expect(normalizeColor("  #abcdef ")).toBe("#abcdef");
  });

  it("expands 3-digit hex shorthand", () => {
    expect(normalizeColor("#f00")).toBe("#ff0000");
  });

  it("maps known named colors case-insensitively", () => {
    expect(normalizeColor("red")).toBe("#EF4444");
    expect(normalizeColor("BLUE")).toBe("#2563EB");
  });

  it("falls back to the default for unknown or non-string values", () => {
    expect(normalizeColor("rebeccapurple")).toBe("#0E7C86");
    expect(normalizeColor(undefined)).toBe("#0E7C86");
    expect(normalizeColor(42)).toBe("#0E7C86");
  });
});

describe("normalizeEventType", () => {
  it("keeps known enum codes", () => {
    expect(normalizeEventType("MA")).toBe("MA");
    expect(normalizeEventType("S")).toBe("S");
  });

  it("coerces unknown or missing values to 'other'", () => {
    expect(normalizeEventType("appointment")).toBe("other");
    expect(normalizeEventType(undefined)).toBe("other");
    expect(normalizeEventType(null)).toBe("other");
  });
});

describe("normalizeEventDate", () => {
  it("passes through ISO strings", () => {
    expect(normalizeEventDate("2024-05-10T14:30:00.000Z")).toBe("2024-05-10T14:30:00.000Z");
  });

  it("converts Date instances", () => {
    const date = new Date("2023-01-02T03:04:05.000Z");
    expect(normalizeEventDate(date)).toBe("2023-01-02T03:04:05.000Z");
  });

  it("converts Firestore { seconds } timestamps", () => {
    expect(normalizeEventDate({ seconds: 1_700_000_000 })).toBe(
      new Date(1_700_000_000 * 1000).toISOString(),
    );
  });

  it("converts objects exposing toDate()", () => {
    const stamp = { toDate: () => new Date("2022-06-07T08:09:10.000Z") };
    expect(normalizeEventDate(stamp)).toBe("2022-06-07T08:09:10.000Z");
  });

  it("returns a valid ISO string for unparseable input", () => {
    const result = normalizeEventDate("not-a-date");
    expect(Number.isNaN(Date.parse(result))).toBe(false);
  });
});
