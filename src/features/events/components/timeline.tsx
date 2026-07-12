import type { MedEvent } from "@/lib/domain/types";
import { TimelineItem } from "./timeline-item";

interface TimelineProps {
  events: MedEvent[];
  lineId: string;
  onDeleteEvent?: (eventId: string) => void;
  deletingEventId?: string | null;
}

export function Timeline({ events, lineId, onDeleteEvent, deletingEventId }: TimelineProps) {
  return (
    <ol className="relative">
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          lineId={lineId}
          isLast={index === events.length - 1}
          onDelete={onDeleteEvent}
          isDeleting={deletingEventId === event.id}
        />
      ))}
    </ol>
  );
}
