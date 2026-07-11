import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/signup-form";

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/" });
  },
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start organising your medical history securely."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
