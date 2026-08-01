import { Link } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterLinesByTitle } from "@/features/lines/filter-lines";
import type { Line } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface TimelinesNavProps {
  lines: Line[];
  activeLineId: string | null;
  isTimelinesHome?: boolean;
  onNavigate?: () => void;
}

export function TimelinesNav({
  lines,
  activeLineId,
  isTimelinesHome = false,
  onNavigate,
}: TimelinesNavProps) {
  const [expanded, setExpanded] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
      setExpanded(true);
    }
  }, [searchOpen]);

  const visibleLines = filterLinesByTitle(lines, query);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <div className="flex min-h-0 max-h-[calc(100%-2.5rem)] flex-col gap-1 overflow-hidden">
      <div
        className={cn(
          "flex w-full shrink-0 items-center gap-0.5 rounded-lg py-1 pr-1 pl-3 text-sm font-medium text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isTimelinesHome && "bg-accent text-accent-foreground",
        )}
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            onClick={onNavigate}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1 transition-colors",
              searchOpen && "pointer-events-none",
            )}
            tabIndex={searchOpen ? -1 : undefined}
            aria-hidden={searchOpen || undefined}
          >
            <LayoutGrid className="size-4 shrink-0" />
            <span
              className={cn(
                "truncate transition-all duration-200",
                searchOpen ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100",
              )}
            >
              Timelines
            </span>
          </Link>

          <div
            className={cn(
              "absolute inset-y-0 left-0 right-0 flex items-center gap-2 transition-all duration-200",
              searchOpen
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-2 opacity-0",
            )}
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            <label htmlFor={searchInputId} className="sr-only">
              Search timelines
            </label>
            <Input
              ref={inputRef}
              id={searchInputId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeSearch();
              }}
              placeholder="Search…"
              className={cn(
                "h-8 rounded-none border-0 border-l border-border bg-transparent px-2 shadow-none",
                "dark:bg-transparent",
                "focus-visible:border-l focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0",
              )}
              aria-label="Search timelines"
              tabIndex={searchOpen ? 0 : -1}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:bg-transparent hover:text-accent-foreground"
          aria-label={searchOpen ? "Close timeline search" : "Search timelines"}
          aria-expanded={searchOpen}
          onClick={() => {
            if (searchOpen) closeSearch();
            else setSearchOpen(true);
          }}
        >
          {searchOpen ? <X className="size-3.5" /> : <Search className="size-3.5" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:bg-transparent hover:text-accent-foreground"
          aria-label={expanded ? "Collapse timelines" : "Expand timelines"}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200 ease-out",
              expanded && "rotate-90",
            )}
          />
        </Button>
      </div>

      <div
        className={cn(
          "grid min-h-0 transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded ? "flex-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={!expanded}
      >
        <div className="scrollbar-minimal min-h-0 overflow-y-auto overflow-x-hidden pr-2.5">
          <ul className="mr-1 ml-5 flex flex-col gap-0.5 border-l border-border/70 pl-2">
            {visibleLines.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-muted-foreground">No timelines found</li>
            ) : (
              visibleLines.map((line, index) => {
                const isActive = line.id === activeLineId;
                return (
                  <li
                    key={line.id}
                    className={cn(
                      "transition-all duration-200 ease-out",
                      expanded ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                    )}
                    style={{ transitionDelay: expanded ? `${index * 20}ms` : "0ms" }}
                  >
                    <Link
                      to="/lines/$lineId"
                      params={{ lineId: line.id }}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      tabIndex={expanded ? undefined : -1}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent font-medium text-accent-foreground",
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">{line.title}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {line.eventCount}
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
