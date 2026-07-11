import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetRequestForm } from "@/features/auth/components/reset-request-form";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link
          to="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthCard>
  );
}
