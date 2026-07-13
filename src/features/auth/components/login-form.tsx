import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInFn } from "../auth.api";
import { type SignInValues, signInSchema } from "../auth.schema";

const VERIFY_EMAIL_MESSAGE =
  "Please verify your email before signing in. Check your inbox for the confirmation link.";

export function LoginForm() {
  const navigate = useNavigate();
  const [verifyEmailError, setVerifyEmailError] = useState<string | null>(null);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: SignInValues) => signInFn({ data: values }),
    onSuccess: async () => {
      setVerifyEmailError(null);
      await navigate({ to: "/" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      if (message === VERIFY_EMAIL_MESSAGE) {
        setVerifyEmailError(message);
        form.setError("root", { message });
        return;
      }
      setVerifyEmailError(null);
      form.setError("root", { message });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          setVerifyEmailError(null);
          form.clearErrors("root");
          mutation.mutate(values);
        })}
        className="space-y-4"
        noValidate
      >
        {verifyEmailError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Email not verified</AlertTitle>
            <AlertDescription>{verifyEmailError}</AlertDescription>
          </Alert>
        ) : null}
        {form.formState.errors.root && !verifyEmailError ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  to="/reset-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
