import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { getServerContext, requireUser } from "@/lib/server/context";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { EMAIL_NOT_VERIFIED_MESSAGE } from "@/lib/supabase/repositories/auth.repository";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./auth.schema";

export { EMAIL_NOT_VERIFIED_MESSAGE };

export interface AppUser {
  id: string;
  email: string | null;
}

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppUser | null> => {
    const { repos } = getServerContext();
    const user = await repos.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  },
);

export const signInFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => signInSchema.parse(d))
  .handler(async ({ data }) => {
    enforceRateLimit({ key: "login", limit: 8, windowMs: 60_000 });
    const { repos } = getServerContext();
    const result = await repos.auth.signIn(data.email, data.password);
    if (!result.ok) throw new Error(result.message ?? "Sign in failed.");
    return { ok: true as const };
  });

export const signUpFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => signUpSchema.parse(d))
  .handler(async ({ data }) => {
    enforceRateLimit({ key: "signup", limit: 5, windowMs: 60_000 });
    const { repos } = getServerContext();
    const origin = new URL(String(getRequestUrl())).origin;
    const redirectTo = new URL("/login", origin).toString();
    const result = await repos.auth.signUp(data.email, data.password, redirectTo);
    if (!result.ok) throw new Error(result.message ?? "Sign up failed.");
    return { ok: true as const };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { repos } = getServerContext();
  await repos.auth.signOut();
  return { ok: true as const };
});

export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => resetRequestSchema.parse(d))
  .handler(async ({ data }) => {
    enforceRateLimit({ key: "reset", limit: 5, windowMs: 300_000 });
    const { repos } = getServerContext();
    const origin = new URL(String(getRequestUrl())).origin;
    const redirectTo = new URL("/update-password", origin).toString();
    await repos.auth.resetPasswordForEmail(data.email, redirectTo);
    // Always ok, to avoid revealing whether the email exists.
    return { ok: true as const };
  });

export const exchangeRecoveryCodeFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { client } = getServerContext();
    const { error } = await client.auth.exchangeCodeForSession(data.code);
    if (error) throw new Error("This reset link is invalid or has expired.");
    return { ok: true as const };
  });

export const updatePasswordFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => updatePasswordSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const result = await repos.auth.updatePassword(data.password);
    if (!result.ok) throw new Error(result.message ?? "Could not update password.");
    return { ok: true as const };
  });
