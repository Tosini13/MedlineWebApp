import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatFileSize } from "./format";

describe("formatDate", () => {
  it("formats a valid ISO date", () => {
    expect(formatDate("2026-03-14T00:00:00.000Z")).toContain("2026");
  });

  it("returns empty string for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("includes a time component for valid input", () => {
    expect(formatDateTime("2026-03-14T09:30:00.000Z")).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("returns empty string for null", () => {
    expect(formatFileSize(null)).toBe("");
  });
});
