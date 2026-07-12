import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/$eventId")({
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
