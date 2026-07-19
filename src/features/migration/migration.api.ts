import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import type { FirebaseSummary } from "@/lib/server/firebase/data";
import { migrateFirebaseToSupabase } from "@/lib/server/firebase/migrate";
import { getFirebaseDataProvider } from "@/lib/server/firebase/provider";

const EMPTY_SUMMARY: FirebaseSummary = {
  configured: false,
  hasData: false,
  lineCount: 0,
  eventCount: 0,
  documentCount: 0,
};

export const fetchFirebaseSummary = createServerFn({ method: "GET" }).handler(async () => {
  const { user } = await requireUser();
  if (!user.email) return EMPTY_SUMMARY;
  return getFirebaseDataProvider().getSummary(user.email);
});

export const migrateFromFirebase = createServerFn({ method: "POST" }).handler(async () => {
  const { user, repos } = await requireUser();
  if (!user.email) {
    throw new Error("Your account has no email address to match legacy data.");
  }
  return migrateFirebaseToSupabase({ email: user.email, userId: user.id, repos });
});
