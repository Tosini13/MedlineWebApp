import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { EventTypeBadge } from "@/features/events/components/event-type-badge";
import { searchQueryOptions } from "@/features/search/search.queries";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 250);
  const query = useQuery(searchQueryOptions(debounced));

  const results = query.data;
  const hasResults = results && (results.lines.length > 0 || results.events.length > 0);
  const isSearching = debounced.trim().length >= 2;

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Find timelines and events by keyword." />

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search timelines and events…"
          className="pl-9"
        />
        {query.isFetching && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {!isSearching ? (
        <EmptyState
          icon={SearchIcon}
          title="Start typing to search"
          description="Enter at least two characters to search across your timelines and events."
        />
      ) : hasResults ? (
        <div className="space-y-8">
          {results.lines.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Timelines</h2>
              <div className="space-y-2">
                {results.lines.map((line) => (
                  <Link
                    key={line.id}
                    to="/lines/$lineId"
                    params={{ lineId: line.id }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    <span className="font-medium">{line.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.events.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Events</h2>
              <div className="space-y-2">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    to="/lines/$lineId/events/$eventId"
                    params={{ lineId: event.lineId, eventId: event.id }}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-3">
                      <EventTypeBadge code={event.type} />
                      <span className="font-medium">{event.title}</span>
                    </span>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </time>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="No results"
          description={`Nothing matched "${debounced}".`}
        />
      )}
    </div>
  );
}
