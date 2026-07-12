import { z } from "zod";
import { EVENT_TYPE_CODES } from "@/lib/domain/event-type";

const titleSchema = z.string().trim().min(1, "Title is required.").max(200);
/**
 * Form-facing description: input and output types match (`string | undefined`)
 * so react-hook-form's resolver stays compatible with shadcn `FormField`.
 */
const descriptionSchema = z.string().trim().max(5000, "Description is too long.").optional();
/** Empty descriptions are normalized to `null` before hitting the database. */
const toNullableDescription = (v: string | undefined) => (v && v.length > 0 ? v : null);
const typeSchema = z.enum(EVENT_TYPE_CODES);
const isoDateSchema = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date.");

/** Form values used by the create/edit event form (date handled as a Date object). */
export const eventFormSchema = z.object({
  title: titleSchema,
  date: z.date({ message: "Pick a date." }),
  description: descriptionSchema,
  type: typeSchema,
});

export const createEventSchema = z.object({
  lineId: z.uuid(),
  title: titleSchema,
  date: isoDateSchema,
  description: descriptionSchema.transform(toNullableDescription),
  type: typeSchema,
});

export const updateEventSchema = z.object({
  id: z.uuid(),
  title: titleSchema.optional(),
  date: isoDateSchema.optional(),
  description: descriptionSchema.optional().transform(toNullableDescription),
  type: typeSchema.optional(),
});

export const eventIdSchema = z.object({ id: z.uuid() });

export type EventFormValues = z.input<typeof eventFormSchema>;
export type EventFormOutput = z.output<typeof eventFormSchema>;
export type CreateEventValues = z.input<typeof createEventSchema>;
export type UpdateEventValues = z.input<typeof updateEventSchema>;
