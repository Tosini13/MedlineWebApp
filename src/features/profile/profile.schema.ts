import { z } from "zod";
import { BLOOD_TYPES } from "@/lib/domain/blood-type";

const toNullable = (value: string | undefined) => (value && value.length > 0 ? value : null);

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} is too long.`).optional();

const dateOfBirthSchema = z
  .string()
  .optional()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date.");

const bloodTypeSchema = z
  .string()
  .optional()
  .refine(
    (value) => !value || (BLOOD_TYPES as readonly string[]).includes(value),
    "Pick a valid blood type.",
  );

/** Form values used by the profile edit form. Input and output types match. */
export const profileFormSchema = z.object({
  dateOfBirth: dateOfBirthSchema,
  bloodType: bloodTypeSchema,
  emergencyContact: optionalText(500, "Emergency contact"),
  medicaments: optionalText(2000, "Medicaments"),
  chronicHealthIssues: optionalText(2000, "Health issues"),
  lockScreenSummary: optionalText(500, "Lock screen summary"),
});

export const upsertProfileSchema = z.object({
  dateOfBirth: dateOfBirthSchema.optional().transform(toNullable),
  bloodType: bloodTypeSchema.optional().transform(toNullable),
  emergencyContact: optionalText(500, "Emergency contact").optional().transform(toNullable),
  medicaments: optionalText(2000, "Medicaments").optional().transform(toNullable),
  chronicHealthIssues: optionalText(2000, "Health issues").optional().transform(toNullable),
  lockScreenSummary: optionalText(500, "Lock screen summary").optional().transform(toNullable),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;
export type UpsertProfileValues = z.input<typeof upsertProfileSchema>;
