export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];

export const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string }[] = BLOOD_TYPES.map(
  (value) => ({ value, label: value }),
);
