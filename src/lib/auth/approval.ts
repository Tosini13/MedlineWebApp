export const PENDING_APPROVAL_MESSAGE =
  "Your account is pending approval. You will be notified when an administrator approves your account.";

export function isUserPendingApproval(appMetadata: Record<string, unknown> | undefined): boolean {
  return appMetadata?.approved === false;
}
