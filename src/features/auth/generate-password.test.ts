import { describe, expect, it } from "vitest";
import { generateSecurePassword } from "./generate-password";

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[!@#$%^&*\-_=+]/;

describe("generateSecurePassword", () => {
  it("defaults to 16 characters", () => {
    expect(generateSecurePassword()).toHaveLength(16);
  });

  it("clamps length to the 8–128 range", () => {
    expect(generateSecurePassword(4)).toHaveLength(8);
    expect(generateSecurePassword(200)).toHaveLength(128);
  });

  it("includes at least one character from each required class", () => {
    const password = generateSecurePassword(24);
    expect(password).toMatch(UPPER);
    expect(password).toMatch(LOWER);
    expect(password).toMatch(DIGIT);
    expect(password).toMatch(SYMBOL);
  });

  it("generates different passwords on successive calls", () => {
    const first = generateSecurePassword();
    const second = generateSecurePassword();
    expect(first).not.toBe(second);
  });
});
