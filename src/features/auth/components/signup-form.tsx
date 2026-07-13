import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpFn } from "../auth.api";
import { type SignUpFormValues, signUpFormSchema } from "../auth.schema";
import { getRecaptchaToken, RecaptchaCheckbox, resetRecaptcha } from "./recaptcha-checkbox";
import { generateSecurePassword } from "../generate-password";

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export function SignUpForm() {
  const navigate = useNavigate();
  const recaptchaWidgetIdRef = useRef<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: SignUpFormValues) => signUpFn({ data: values }),
    onSuccess: async () => {
      toast.success("Account created. Pending admin approval.");
      await navigate({ to: "/login" });
    },
    onError: (error) => {
      resetRecaptcha(recaptchaWidgetIdRef.current);
      toast.error(error instanceof Error ? error.message : "Sign up failed.");
    },
  });

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Could not copy password");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (!recaptchaSiteKey) {
            toast.error("Sign up is temporarily unavailable.");
            return;
          }

          const recaptchaToken = getRecaptchaToken(recaptchaWidgetIdRef.current);
          if (!recaptchaToken) {
            toast.error("Please complete the reCAPTCHA.");
            return;
          }

          mutation.mutate({ ...values, recaptchaToken });
        })}
        className="space-y-4"
        noValidate
      >
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
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Password</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const generated = generateSecurePassword();
                    form.setValue("password", generated, { shouldValidate: true });
                    setShowPassword(true);
                    toast.success("Password generated");
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  Generate password
                </Button>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-20"
                    {...field}
                  />
                </FormControl>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Copy password"
                    disabled={!field.value}
                    onClick={() => void copyPassword(field.value)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <FormDescription>At least 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {recaptchaSiteKey ? (
          <RecaptchaCheckbox
            siteKey={recaptchaSiteKey}
            onWidgetReady={(widgetId) => {
              recaptchaWidgetIdRef.current = widgetId;
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Sign up is temporarily unavailable. Please try again later.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending || !recaptchaSiteKey}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </Form>
  );
}
