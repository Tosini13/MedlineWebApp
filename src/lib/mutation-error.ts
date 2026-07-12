import { RepositoryError } from "@/lib/supabase/repositories/base.repository";

/** Maps server/repository failures to a short message safe to show in a toast. */
export function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RepositoryError) {
    return repositoryCodeMessage(error.code, error.message);
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (message.length > 0 && message.length < 300) {
    if (message.includes("42P01") || /relation .* does not exist/i.test(message)) {
      return "Database tables are missing. Run pnpm db:push against your Supabase project.";
    }
    if (message.includes("42501") || /permission denied/i.test(message)) {
      return "Permission denied. Check that migrations and RLS policies are applied.";
    }
    return message;
  }

  return fallback;
}

function repositoryCodeMessage(code: string | undefined, message: string): string {
  if (code === "42P01") {
    return "Database tables are missing. Run pnpm db:push against your Supabase project.";
  }
  if (code === "42501") {
    return "Permission denied. Check that migrations and RLS policies are applied.";
  }
  return message;
}
