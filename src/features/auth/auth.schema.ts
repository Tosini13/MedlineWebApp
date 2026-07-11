import { z } from "zod";

export const emailSchema = z
  .email()
  .max(320)
  .transform((v) => v.trim().toLowerCase());
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ResetRequestValues = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
