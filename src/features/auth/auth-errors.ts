/** Shown only when Supabase confirms the account email is not verified. */
export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before signing in. Check your inbox for the confirmation link.";

export function isEmailNotConfirmedError(error: { code?: string }): boolean {
  return error.code === "email_not_confirmed";
}
