import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
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

const PASSWORD_CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*-_=+",
} as const;

function pickRandomChar(charset: string): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return charset[values[0]! % charset.length]!;
}

function generateSecurePassword(length = 16): string {
  const all =
    PASSWORD_CHARSETS.upper +
    PASSWORD_CHARSETS.lower +
    PASSWORD_CHARSETS.digits +
    PASSWORD_CHARSETS.symbols;
  const len = Math.min(Math.max(length, 8), 128);

  const chars = [
    pickRandomChar(PASSWORD_CHARSETS.upper),
    pickRandomChar(PASSWORD_CHARSETS.lower),
    pickRandomChar(PASSWORD_CHARSETS.digits),
    pickRandomChar(PASSWORD_CHARSETS.symbols),
  ];

  while (chars.length < len) {
    chars.push(pickRandomChar(all));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const j = values[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

export function SignUpForm() {
  const navigate = useNavigate();
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
                    toast.success("Password generated");
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  Generate password
                </Button>
              </div>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
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
