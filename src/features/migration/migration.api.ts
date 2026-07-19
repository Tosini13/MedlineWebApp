import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import { migrateFirebaseToSupabase } from "@/lib/server/firebase/migrate";

export const migrateFromFirebase = createServerFn({ method: "POST" }).handler(async () => {
  const { user, repos } = await requireUser();
  if (!user.email) {
    throw new Error("Your account has no email address to match legacy data.");
  }
  return migrateFirebaseToSupabase({ email: user.email, userId: user.id, repos });
});
