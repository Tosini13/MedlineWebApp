import { Link } from "@tanstack/react-router";
import { LayoutGrid, Menu, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Brand } from "@/components/app/brand";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
  email: string | null;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/", label: "Timelines", icon: LayoutGrid, exact: true },
  { to: "/search", label: "Search", icon: Search, exact: false },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          onClick={onNavigate}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          )}
          activeProps={{ className: "bg-accent text-accent-foreground" }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ email, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <Link to="/" className="cursor-pointer px-2">
          <Brand />
        </Link>
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <p className="px-3 text-xs text-muted-foreground">
          Your data is private and encrypted in transit.
        </p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  <div className="mt-8 flex-1">
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
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
