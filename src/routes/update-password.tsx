import { createFileRoute } from "@tanstack/react-router";
import { exchangeRecoveryCodeFn } from "@/features/auth/auth.api";
import { AuthCard } from "@/features/auth/components/auth-card";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

interface UpdatePasswordSearch {
  code?: string;
}

export const Route = createFileRoute("/update-password")({
  validateSearch: (search: Record<string, unknown>): UpdatePasswordSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (search.code) {
      try {
        await exchangeRecoveryCodeFn({ data: { code: search.code } });
      } catch {
        // Surfaced to the user when they submit the form.
      }
    }
  },
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password you don't use elsewhere."
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
