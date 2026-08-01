import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { EntitySettingsMenu } from "@/components/app/entity-settings-menu";
import { eventTypeMeta } from "@/lib/domain/event-type";
import type { MedEvent } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { EventTypeBadge } from "./event-type-badge";
import { EventTypeIcon } from "./event-type-icon";

interface TimelineItemProps {
  event: MedEvent;
  lineId: string;
  isLast: boolean;
  onDelete?: (eventId: string) => void;
  isDeleting?: boolean;
}

export function TimelineItem({
  event,
  lineId,
  isLast,
  onDelete,
  isDeleting = false,
}: TimelineItemProps) {
  const meta = eventTypeMeta(event.type);

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 bg-border"
        />
      )}
      <span
        aria-hidden
        className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background"
        style={{
          color: meta.colorVar,
          backgroundColor: `color-mix(in oklch, ${meta.colorVar} 15%, transparent)`,
        }}
      >
        <EventTypeIcon code={event.type} className="size-4" />
      </span>
      <div className="group -mt-1 flex min-w-0 flex-1 gap-2">
        <Link
          to="/lines/$lineId/events/$eventId"
          params={{ lineId, eventId: event.id }}
          className="min-w-0 flex-1 cursor-pointer focus-visible:outline-none"
        >
          <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-sm group-focus-within:ring-2 group-focus-within:ring-ring">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium leading-tight">{event.title}</h3>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.date}>
                {formatDate(event.date)}
              </time>
            </div>
            <div className="mt-2">
              <EventTypeBadge code={event.type} />
            </div>
            {event.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
        </Link>
        <EntitySettingsMenu
          ariaLabel={`Settings for ${event.title}`}
          triggerVariant="ghost"
          triggerClassName="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          editItem={
            <Link to="/lines/$lineId/events/$eventId/edit" params={{ lineId, eventId: event.id }}>
              <Pencil className="size-4" />
              Edit
            </Link>
          }
          deleteTitle={onDelete ? "Delete this event?" : undefined}
          deleteDescription={
            onDelete ? "This permanently deletes the event and its documents." : undefined
          }
          isDeleting={isDeleting}
          onDelete={onDelete ? () => onDelete(event.id) : undefined}
        />
      </div>
    </li>
  );
}
