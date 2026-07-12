import { EVENT_TYPE_CODES } from "@/lib/domain/event-type";
import type { EventTypeCode } from "@/lib/supabase/database.types";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = "#0E7C86";

/** Named colors the legacy app may have stored, mapped to the design palette. */
const NAMED_COLORS: Record<string, string> = {
  red: "#EF4444",
  blue: "#2563EB",
  green: "#16A34A",
  orange: "#F97316",
  purple: "#9333EA",
  yellow: "#EAB308",
  teal: "#0E7C86",
  pink: "#EC4899",
  gray: "#6B7280",
  grey: "#6B7280",
  black: "#111827",
  white: "#F3F4F6",
};

/** Coerces a legacy color value into a valid 6-digit hex color. */
export function normalizeColor(input: unknown): string {
  if (typeof input !== "string") return DEFAULT_COLOR;
  const trimmed = input.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed;
  // Expand shorthand #abc -> #aabbcc.
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return NAMED_COLORS[trimmed.toLowerCase()] ?? DEFAULT_COLOR;
}

/** Coerces a legacy event type into a known enum value; unknown -> "other". */
export function normalizeEventType(input: unknown): EventTypeCode {
  if (typeof input === "string" && (EVENT_TYPE_CODES as readonly string[]).includes(input)) {
    return input as EventTypeCode;
  }
  return "other";
}

/**
 * Normalizes a legacy event date into an ISO string. Handles ISO strings,
 * firebase-admin `Timestamp` instances (`.toDate()`), and `{ seconds }` shapes.
 * Falls back to the current time when a value cannot be parsed.
 */
export function normalizeEventDate(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
  }

  if (value && typeof value === "object") {
    const record = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof record.toDate === "function") {
      const date = record.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : new Date().toISOString();
    }
    const seconds = record.seconds ?? record._seconds;
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return new Date().toISOString();
}
