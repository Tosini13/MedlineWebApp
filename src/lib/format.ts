import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return isValid(date) ? format(date, "d MMM yyyy") : "";
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return isValid(date) ? format(date, "d MMM yyyy, HH:mm") : "";
}

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "";
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
