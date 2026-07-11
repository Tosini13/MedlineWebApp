import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to access your medical timelines."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
