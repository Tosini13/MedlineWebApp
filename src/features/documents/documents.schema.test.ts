import { describe, expect, it } from "vitest";
import { isAllowedMimeType, sanitizeFileName } from "./documents.schema";

describe("isAllowedMimeType", () => {
  it("accepts allowed types", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(isAllowedMimeType("image/png")).toBe(true);
  });

  it("rejects disallowed types", () => {
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMimeType("")).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it("strips directory traversal segments", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Users\\me\\report.pdf")).toBe("report.pdf");
  });

  it("replaces unsafe characters and collapses underscores", () => {
    expect(sanitizeFileName("my report (final)!.pdf")).toBe("my_report_final_.pdf");
  });

  it("falls back to a default name", () => {
    expect(sanitizeFileName("")).toBe("file");
  });
});
