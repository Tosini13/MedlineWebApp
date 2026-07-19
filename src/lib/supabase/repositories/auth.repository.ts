import type { User } from "@supabase/supabase-js";
import { EMAIL_NOT_VERIFIED_MESSAGE, isEmailNotConfirmedError } from "@/features/auth/auth-errors";
import { isUserPendingApproval, PENDING_APPROVAL_MESSAGE } from "@/lib/auth/approval";
import { BaseRepository } from "./base.repository";

export interface AuthResult {
  ok: boolean;
  message?: string;
  userId?: string;
}

export { PENDING_APPROVAL_MESSAGE };

export class AuthRepository extends BaseRepository {
  async getUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      if (isEmailNotConfirmedError(error)) {
        return { ok: false, message: EMAIL_NOT_VERIFIED_MESSAGE };
      }
      return { ok: false, message: "Invalid email or password." };
    }

    if (isUserPendingApproval(data.user?.app_metadata)) {
      await this.client.auth.signOut();
      return { ok: false, message: PENDING_APPROVAL_MESSAGE };
    }

    return { ok: true };
  }

  async signUp(email: string, password: string, emailRedirectTo?: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    if (error) {
      return { ok: false, message: "Could not complete sign up. Please try again." };
    }
    return { ok: true, userId: data.user?.id };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<AuthResult> {
    await this.client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
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
