import { eventTypeMeta } from "@/lib/domain/event-type";
import type { EventTypeCode } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { EventTypeIcon } from "./event-type-icon";

interface EventTypeBadgeProps {
  code: EventTypeCode;
  className?: string;
}

export function EventTypeBadge({ code, className }: EventTypeBadgeProps) {
  const meta = eventTypeMeta(code);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color: meta.colorVar,
        borderColor: `color-mix(in oklch, ${meta.colorVar} 35%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${meta.colorVar} 12%, transparent)`,
      }}
    >
      <EventTypeIcon code={code} className="size-3" />
      {meta.label}
    </span>
  );
}
