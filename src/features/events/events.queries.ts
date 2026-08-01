import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { linesKeys } from "@/features/lines/lines.queries";
import type { MedEventWithDocuments } from "@/lib/domain/types";
import { createEvent, deleteEvent, fetchEvent, fetchEventsByLine, updateEvent } from "./events.api";
import type { CreateEventValues, UpdateEventValues } from "./events.schema";

export const eventsKeys = {
  byLine: (lineId: string) => ["events", "line", lineId] as const,
  detail: (id: string) => ["events", "detail", id] as const,
};

export const eventsByLineQueryOptions = (lineId: string) =>
  queryOptions({
    queryKey: eventsKeys.byLine(lineId),
    queryFn: () => fetchEventsByLine({ data: { lineId } }),
  });

export const eventQueryOptions = (id: string) =>
  queryOptions({
    queryKey: eventsKeys.detail(id),
    queryFn: () => fetchEvent({ data: { id } }) as Promise<MedEventWithDocuments | null>,
  });

export function useCreateEvent(lineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateEventValues) => createEvent({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.byLine(lineId) });
      queryClient.invalidateQueries({ queryKey: linesKeys.all });
    },
  });
}

export function useUpdateEvent(lineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateEventValues) => updateEvent({ data: values }),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.byLine(lineId) });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(event.id) });
    },
  });
}

export function useDeleteEvent(lineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.byLine(lineId) });
      queryClient.invalidateQueries({ queryKey: linesKeys.all });
    },
  });
}
