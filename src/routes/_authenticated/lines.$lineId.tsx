import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lines/$lineId")({
  component: LineLayout,
});

function LineLayout() {
  return <Outlet />;
}
