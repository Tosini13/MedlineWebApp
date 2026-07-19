import { describe, expect, it } from "vitest";
import { profileFormSchema, upsertProfileSchema } from "./profile.schema";

describe("profileFormSchema", () => {
  it("accepts an empty profile (all fields optional)", () => {
    const parsed = profileFormSchema.parse({});
    expect(parsed.dateOfBirth).toBeUndefined();
    expect(parsed.bloodType).toBeUndefined();
    expect(parsed.emergencyContact).toBeUndefined();
  });

  it("accepts a valid date of birth in YYYY-MM-DD format", () => {
    const parsed = profileFormSchema.parse({ dateOfBirth: "1990-05-15" });
    expect(parsed.dateOfBirth).toBe("1990-05-15");
  });

  it("rejects malformed or unparseable dates of birth", () => {
    expect(() => profileFormSchema.parse({ dateOfBirth: "15/05/1990" })).toThrow(/valid date/);
    expect(() => profileFormSchema.parse({ dateOfBirth: "1990-13-40" })).toThrow(/valid date/);
  });

  it("accepts known blood types and rejects unknown values", () => {
    expect(profileFormSchema.parse({ bloodType: "O+" }).bloodType).toBe("O+");
    expect(() => profileFormSchema.parse({ bloodType: "X+" })).toThrow(/valid blood type/);
  });

  it("enforces max lengths on free-text fields", () => {
    expect(() => profileFormSchema.parse({ emergencyContact: "x".repeat(501) })).toThrow(
      /too long/,
    );
    expect(() => profileFormSchema.parse({ medicaments: "x".repeat(2001) })).toThrow(/too long/);
  });
});

describe("upsertProfileSchema", () => {
  it("normalizes empty strings to null for persistence", () => {
    const parsed = upsertProfileSchema.parse({
      dateOfBirth: "",
      bloodType: "",
      emergencyContact: "",
      medicaments: "",
      chronicHealthIssues: "",
      lockScreenSummary: "",
    });
    expect(parsed.dateOfBirth).toBeNull();
    expect(parsed.bloodType).toBeNull();
    expect(parsed.emergencyContact).toBeNull();
    expect(parsed.medicaments).toBeNull();
    expect(parsed.chronicHealthIssues).toBeNull();
    expect(parsed.lockScreenSummary).toBeNull();
  });

  it("keeps provided values after trimming", () => {
    const parsed = upsertProfileSchema.parse({
      emergencyContact: "  Jane Doe — spouse  ",
      bloodType: "A-",
    });
    expect(parsed.emergencyContact).toBe("Jane Doe — spouse");
    expect(parsed.bloodType).toBe("A-");
  });
});
