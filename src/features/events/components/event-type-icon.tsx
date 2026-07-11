import {
  CalendarCheck,
  CircleDot,
  FlaskConical,
  type LucideIcon,
  Scissors,
  Stethoscope,
} from "lucide-react";
import type { EventTypeCode } from "@/lib/domain/types";

export const EVENT_TYPE_ICONS: Record<EventTypeCode, LucideIcon> = {
  MA: Stethoscope,
  O: CircleDot,
  MT: FlaskConical,
  S: Scissors,
  other: CalendarCheck,
};

interface EventTypeIconProps {
  code: EventTypeCode;
  className?: string;
}

export function EventTypeIcon({ code, className }: EventTypeIconProps) {
  const Icon = EVENT_TYPE_ICONS[code] ?? CircleDot;
  return <Icon className={className} />;
}
