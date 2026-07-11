import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Line } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";

interface LineCardProps {
  line: Line;
}

export function LineCard({ line }: LineCardProps) {
  return (
    <Link
      to="/lines/$lineId"
      params={{ lineId: line.id }}
      className="group block focus-visible:outline-none"
    >
      <Card className="relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: line.color }}
        />
        <CardHeader className="pl-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            <span className="truncate">{line.title}</span>
            <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </CardTitle>
          {line.description ? (
            <CardDescription className="line-clamp-2">{line.description}</CardDescription>
          ) : (
            <CardDescription className="italic opacity-70">No description</CardDescription>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            Updated {formatRelative(line.updatedAt)}
          </p>
        </CardHeader>
      </Card>
    </Link>
  );
}
