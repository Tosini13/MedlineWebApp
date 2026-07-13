import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const LINE_COLOR_PRESETS = [
  "#0E7C86",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#0891B2",
  "#475569",
] as const;

export const DEFAULT_LINE_COLOR = LINE_COLOR_PRESETS[0];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Timeline color">
      {LINE_COLOR_PRESETS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase();
        return (
          // biome-ignore lint/a11y/useSemanticElements: a swatch grid needs custom-styled buttons acting as radios
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "ring-2 ring-ring",
            )}
            style={{ backgroundColor: color }}
          >
            {selected && <Check className="size-4 text-white" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
