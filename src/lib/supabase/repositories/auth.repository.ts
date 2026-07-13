import type { User } from "@supabase/supabase-js";
import { EMAIL_NOT_VERIFIED_MESSAGE, isEmailNotConfirmedError } from "@/features/auth/auth-errors";
import { BaseRepository } from "./base.repository";

export interface AuthResult {
  ok: boolean;
  /** Generic, non-enumerating message safe to show to users. */
  message?: string;
  /** True when Supabase confirms the email address is not verified yet. */
  emailNotConfirmed?: boolean;
}

export class AuthRepository extends BaseRepository {
  /**
   * Returns the authenticated user by validating the token with the auth server
   * (never trusts an unverified session read).
   */
  async getUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      if (isEmailNotConfirmedError(error)) {
        return { ok: false, message: EMAIL_NOT_VERIFIED_MESSAGE };
      }
      return { ok: false, message: "Invalid email or password." };
    }
    return { ok: true };
  }

  async signUp(email: string, password: string, emailRedirectTo?: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    if (error) {
      return { ok: false, message: "Could not complete sign up. Please try again." };
    }
    return { ok: true };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<AuthResult> {
    await this.client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
    // Always return success to avoid leaking whether an account exists.
    return { ok: true };
  }

  async updatePassword(password: string): Promise<AuthResult> {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) {
      return { ok: false, message: "Could not update password." };
    }
    return { ok: true };
  }
}
