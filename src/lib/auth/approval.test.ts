import { describe, expect, it } from "vitest";
import { isUserPendingApproval } from "./approval";

describe("isUserPendingApproval", () => {
  it("returns true when approved is explicitly false", () => {
    expect(isUserPendingApproval({ approved: false })).toBe(true);
  });

  it("returns false when approved is true or unset", () => {
    expect(isUserPendingApproval({ approved: true })).toBe(false);
    expect(isUserPendingApproval(undefined)).toBe(false);
  });
});
