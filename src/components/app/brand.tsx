import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  showWordmark?: boolean;
}

export function Brand({ className, showWordmark = true }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5 font-display", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm">
        <Activity className="size-5" strokeWidth={2.5} />
      </span>
      {showWordmark && <span className="text-lg font-semibold tracking-tight">Medline</span>}
    </span>
  );
}
