import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Brand } from "@/components/app/brand";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { TimelinesNav } from "@/components/app/timelines-nav";
import { UserMenu } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { linesQueryOptions } from "@/features/lines/lines.queries";
import { activeLineIdFromPath } from "@/lib/domain/line-event-count";
import { cn } from "@/lib/utils";

interface AppShellProps {
  email: string | null;
  children: ReactNode;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data: lines = [] } = useQuery(linesQueryOptions());
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeLineId = activeLineIdFromPath(pathname);

  return (
    <nav className="flex flex-col gap-1">
      <TimelinesNav lines={lines} activeLineId={activeLineId} onNavigate={onNavigate} />
      <Link
        to="/search"
        onClick={onNavigate}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        )}
        activeProps={{ className: "bg-accent text-accent-foreground" }}
      >
        <Search className="size-4" />
        Search
      </Link>
    </nav>
  );
}

export function AppShell({ email, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <Link to="/" className="cursor-pointer px-2">
          <Brand />
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="px-3 text-xs text-muted-foreground">
          Your data is private and encrypted in transit.
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex h-full flex-col px-4 py-5">
                    <SheetTitle asChild>
                      <Brand />
                    </SheetTitle>
                    <div className="mt-8 flex-1 overflow-y-auto">
                      <NavLinks onNavigate={() => setOpen(false)} />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="lg:hidden">
                <Brand showWordmark={false} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu email={email} />
            </div>
          </div>
        </header>

        <main className="app-shell-main mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
