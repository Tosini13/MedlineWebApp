import { z } from "zod";

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const titleSchema = z.string().trim().min(1, "Title is required.").max(200);
/**
 * Form-facing description: input and output types match (`string | undefined`)
 * so react-hook-form's resolver stays compatible with shadcn `FormField`.
 */
const descriptionSchema = z.string().trim().max(2000, "Description is too long.").optional();
const colorSchema = z.string().regex(HEX_COLOR, "Pick a valid color.");

/** Empty descriptions are normalized to `null` before hitting the database. */
const toNullableDescription = (v: string | undefined) => (v && v.length > 0 ? v : null);

/** Form values used by the create/edit line form. */
export const lineFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  color: colorSchema,
});

export const createLineSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.transform(toNullableDescription),
  color: colorSchema,
});

export const updateLineSchema = z.object({
  id: z.uuid(),
  title: titleSchema.optional(),
  description: descriptionSchema.transform(toNullableDescription),
  color: colorSchema.optional(),
});

export const lineIdSchema = z.object({ id: z.uuid() });

export type LineFormValues = z.input<typeof lineFormSchema>;
export type LineFormOutput = z.output<typeof lineFormSchema>;
export type CreateLineValues = z.input<typeof createLineSchema>;
export type UpdateLineValues = z.input<typeof updateLineSchema>;
