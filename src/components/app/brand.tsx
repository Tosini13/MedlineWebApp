import MedlineIcon from "@/assets/brand/icon.svg?react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  showWordmark?: boolean;
}

export function Brand({ className, showWordmark = true }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5 font-display", className)}>
      <MedlineIcon
        className="size-8 shrink-0"
        aria-hidden={showWordmark}
        aria-label={showWordmark ? undefined : "Medline"}
      />
      {showWordmark && <span className="text-lg font-semibold tracking-tight">Medline</span>}
    </span>
  );
}
