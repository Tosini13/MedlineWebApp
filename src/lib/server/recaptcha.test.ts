import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyRecaptchaToken } from "./recaptcha";

describe("verifyRecaptchaToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when Google reports success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }),
    );
    await expect(verifyRecaptchaToken("token", "secret")).resolves.toBe(true);
  });

  it("returns false when Google reports failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) }),
    );
    await expect(verifyRecaptchaToken("token", "secret")).resolves.toBe(false);
  });
});
