import { describe, expect, it } from "vitest";
import { isEmailNotConfirmedError } from "./auth-errors";

describe("isEmailNotConfirmedError", () => {
  it("returns true for Supabase email_not_confirmed code", () => {
    expect(isEmailNotConfirmedError({ code: "email_not_confirmed" })).toBe(true);
  });

  it("returns false for other auth error codes", () => {
    expect(isEmailNotConfirmedError({ code: "invalid_credentials" })).toBe(false);
    expect(isEmailNotConfirmedError({ code: "user_banned" })).toBe(false);
  });

  it("returns false when code is missing", () => {
    expect(isEmailNotConfirmedError({})).toBe(false);
  });
});
