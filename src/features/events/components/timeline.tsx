import type { MedEvent } from "@/lib/domain/types";
import { TimelineItem } from "./timeline-item";

interface TimelineProps {
  events: MedEvent[];
  lineId: string;
}

export function Timeline({ events, lineId }: TimelineProps) {
  return (
    <ol className="relative">
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          lineId={lineId}
          isLast={index === events.length - 1}
        />
      ))}
    </ol>
  );
}
