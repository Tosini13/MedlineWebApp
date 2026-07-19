import type { Profile } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";

interface ProfileDetailsProps {
  profile: Profile | null | undefined;
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  const fields = [
    profile?.dateOfBirth
      ? { label: "Date of birth", value: formatDate(profile.dateOfBirth) }
      : null,
    profile?.bloodType ? { label: "Blood type", value: profile.bloodType } : null,
    profile?.emergencyContact
      ? { label: "Emergency contact", value: profile.emergencyContact }
      : null,
    profile?.medicaments
      ? { label: "Medicaments or supplements", value: profile.medicaments }
      : null,
    profile?.chronicHealthIssues
      ? { label: "Chronic or persistent health issues", value: profile.chronicHealthIssues }
      : null,
    profile?.lockScreenSummary
      ? { label: "Lock screen summary", value: profile.lockScreenSummary }
      : null,
  ].filter((field): field is { label: string; value: string } => field !== null);

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No profile information added yet. All fields are optional.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <ProfileField key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  );
}
