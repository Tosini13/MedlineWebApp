import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutFn } from "@/features/auth/auth.api";

interface UserMenuProps {
  email: string | null;
}

function initials(email: string | null): string {
  if (!email) return "U";
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const signOut = useMutation({
    mutationFn: () => signOutFn(),
    onSuccess: async () => {
      await router.invalidate();
      await router.navigate({ to: "/login" });
    },
    onError: () => toast.error("Could not sign out. Please try again."),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm sm:inline">{email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <UserCog className="mr-2 size-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
