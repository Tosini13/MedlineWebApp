import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
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
import { type SignUpValues, signUpSchema } from "../auth.schema";
import { generateSecurePassword } from "../generate-password";

export function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: SignUpValues) => signUpFn({ data: values }),
    onSuccess: async () => {
      toast.success("Account created. You can sign in now.");
      await navigate({ to: "/login" });
    },
    onError: (error) => {
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
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </Form>
  );
}
