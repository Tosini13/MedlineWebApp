import type { Profile } from "@/lib/domain/types";
import type { Tables } from "../database.types";
import { BaseRepository } from "./base.repository";

export interface UpsertProfileInput {
  dateOfBirth?: string | null;
  bloodType?: string | null;
  emergencyContact?: string | null;
  medicaments?: string | null;
  chronicHealthIssues?: string | null;
  lockScreenSummary?: string | null;
}

function toProfile(row: Tables<"profiles">): Profile {
  return {
    userId: row.user_id,
    dateOfBirth: row.date_of_birth,
    bloodType: row.blood_type,
    emergencyContact: row.emergency_contact,
    medicaments: row.medicaments,
    chronicHealthIssues: row.chronic_health_issues,
    lockScreenSummary: row.lock_screen_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProfilesRepository extends BaseRepository {
  async getByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) this.fail("Failed to load profile.", error);
    return data ? toProfile(data) : null;
  }

  async upsert(userId: string, input: UpsertProfileInput): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          date_of_birth: input.dateOfBirth ?? null,
          blood_type: input.bloodType ?? null,
          emergency_contact: input.emergencyContact ?? null,
          medicaments: input.medicaments ?? null,
          chronic_health_issues: input.chronicHealthIssues ?? null,
          lock_screen_summary: input.lockScreenSummary ?? null,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to save profile.", error);
    return toProfile(data);
  }
}
