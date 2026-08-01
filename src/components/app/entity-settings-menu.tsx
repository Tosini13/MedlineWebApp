import { Settings, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EntitySettingsMenuProps {
  ariaLabel: string;
  /** Content for the Edit menu item (typically a Link). Wrapped with DropdownMenuItem asChild. */
  editItem: ReactNode;
  deleteTitle?: string;
  deleteDescription?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
  triggerVariant?: "outline" | "ghost";
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function EntitySettingsMenu({
  ariaLabel,
  editItem,
  deleteTitle,
  deleteDescription,
  onDelete,
  isDeleting = false,
  triggerVariant = "outline",
  triggerClassName,
  align = "end",
}: EntitySettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={triggerVariant}
          size="icon"
          className={cn("size-8 shrink-0", triggerClassName)}
          aria-label={ariaLabel}
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem asChild>{editItem}</DropdownMenuItem>
        {onDelete && deleteTitle && deleteDescription && (
          <ConfirmDialog
            destructive
            title={deleteTitle}
            description={deleteDescription}
            confirmLabel="Delete"
            onConfirm={onDelete}
            trigger={
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
