import type { EventTypeCode } from "@/lib/supabase/database.types";

export interface EventTypeMeta {
  code: EventTypeCode;
  label: string;
  /** Short label for dense UIs. */
  shortLabel: string;
  /** CSS custom-property-backed token defined in the design system. */
  colorVar: string;
}

/** Source-of-truth ordered tuple of event codes (drives enums + iteration). */
export const EVENT_TYPE_CODES = [
  "MA",
  "O",
  "MT",
  "S",
  "other",
] as const satisfies readonly EventTypeCode[];

/**
 * Human-readable metadata for each event category. Codes match the legacy
 * MedlineMobile values (MA/O/MT/S/other) for data compatibility.
 */
export const EVENT_TYPES: Record<EventTypeCode, EventTypeMeta> = {
  MA: {
    code: "MA",
    label: "Appointment",
    shortLabel: "Appt",
    colorVar: "var(--color-event-appointment)",
  },
  O: {
    code: "O",
    label: "Occurrence",
    shortLabel: "Event",
    colorVar: "var(--color-event-occurrence)",
  },
  MT: {
    code: "MT",
    label: "Test",
    shortLabel: "Test",
    colorVar: "var(--color-event-test)",
  },
  S: {
    code: "S",
    label: "Surgery",
    shortLabel: "Surgery",
    colorVar: "var(--color-event-surgery)",
  },
  other: {
    code: "other",
    label: "Other",
    shortLabel: "Other",
    colorVar: "var(--color-event-other)",
  },
};

export const EVENT_TYPE_OPTIONS = EVENT_TYPE_CODES.map((code) => ({
  value: code,
  label: EVENT_TYPES[code].label,
}));

export function eventTypeMeta(code: EventTypeCode): EventTypeMeta {
  return EVENT_TYPES[code] ?? EVENT_TYPES.other;
}
