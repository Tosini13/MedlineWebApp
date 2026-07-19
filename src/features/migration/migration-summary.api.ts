import { isRedirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import { isFirebaseConfigured } from "@/lib/server/firebase/admin";
import type { FirebaseSummary } from "@/lib/server/firebase/data";
import { getFirebaseDataProvider } from "@/lib/server/firebase/provider";

const EMPTY_SUMMARY: FirebaseSummary = {
  configured: false,
  hasData: false,
  lineCount: 0,
  eventCount: 0,
  documentCount: 0,
};

const LEGACY_READ_ERROR = "Could not read data from the old app. Please try again later.";

export const fetchFirebaseSummary = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { user } = await requireUser();
    if (!user.email) return EMPTY_SUMMARY;
    return getFirebaseDataProvider().getSummary(user.email);
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[fetchFirebaseSummary]", error);
    return {
      ...EMPTY_SUMMARY,
      configured: isFirebaseConfigured(),
      error: LEGACY_READ_ERROR,
    };
  }
});
