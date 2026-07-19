import { describe, expect, it } from "vitest";
import {
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./auth.schema";

describe("emailSchema", () => {
  it("lowercases valid emails", () => {
    expect(emailSchema.parse("User@Example.com")).toBe("user@example.com");
  });

  it("rejects invalid emails", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
    expect(() => emailSchema.parse("")).toThrow();
  });

  it("rejects emails over 320 characters", () => {
    const longLocal = "a".repeat(310);
    expect(() => emailSchema.parse(`${longLocal}@example.com`)).toThrow();
  });
});

describe("passwordSchema", () => {
  it("accepts passwords between 8 and 128 characters", () => {
    expect(passwordSchema.parse("12345678")).toBe("12345678");
    expect(passwordSchema.parse("a".repeat(128))).toHaveLength(128);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(() => passwordSchema.parse("short")).toThrow(/8 characters/);
  });

  it("rejects passwords longer than 128 characters", () => {
    expect(() => passwordSchema.parse("a".repeat(129))).toThrow(/too long/);
  });
});

describe("signInSchema", () => {
  it("requires a non-empty password", () => {
    expect(() => signInSchema.parse({ email: "user@example.com", password: "" })).toThrow(
      /Password is required/,
    );
  });

  it("parses valid credentials", () => {
    const parsed = signInSchema.parse({
      email: "User@Example.com",
      password: "secret123",
    });
    expect(parsed.email).toBe("user@example.com");
    expect(parsed.password).toBe("secret123");
  });
});

describe("signUpSchema", () => {
  it("applies password rules on sign up", () => {
    expect(() =>
      signUpSchema.parse({
        email: "user@example.com",
        password: "1234567",
        turnstileToken: "token",
      }),
    ).toThrow();
  });
});

describe("updatePasswordSchema", () => {
  it("uses the shared password rules", () => {
    expect(() => updatePasswordSchema.parse({ password: "tiny" })).toThrow();
  });
});
