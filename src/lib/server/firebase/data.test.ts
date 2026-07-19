import { beforeEach, describe, expect, it, vi } from "vitest";

const { isFirebaseConfigured, getFirebaseServices } = vi.hoisted(() => ({
  isFirebaseConfigured: vi.fn(),
  getFirebaseServices: vi.fn(),
}));

vi.mock("./admin", () => ({
  isFirebaseConfigured,
  getFirebaseServices,
}));

import { getFirebaseSummary } from "./data";

describe("getFirebaseSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unconfigured summary when Firebase is not set up", async () => {
    isFirebaseConfigured.mockReturnValue(false);

    await expect(getFirebaseSummary("user@example.com")).resolves.toEqual({
      configured: false,
      hasData: false,
      lineCount: 0,
      eventCount: 0,
      documentCount: 0,
    });
  });

  it("returns configured summary with no data when the email is unknown", async () => {
    isFirebaseConfigured.mockReturnValue(true);
    getFirebaseServices.mockResolvedValue({
      auth: {
        getUserByEmail: vi.fn().mockRejectedValue(new Error("not found")),
      },
    });

    await expect(getFirebaseSummary("missing@example.com")).resolves.toEqual({
      configured: true,
      hasData: false,
      lineCount: 0,
      eventCount: 0,
      documentCount: 0,
    });
  });

  it("returns counts when legacy data exists", async () => {
    isFirebaseConfigured.mockReturnValue(true);
    getFirebaseServices.mockResolvedValue({
      auth: {
        getUserByEmail: vi.fn().mockResolvedValue({ uid: "uid-1" }),
      },
      db: {
        collection: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              size: 1,
              docs: [
                {
                  ref: {
                    collection: vi.fn().mockReturnValue({
                      get: vi.fn().mockResolvedValue({
                        size: 2,
                        docs: [
                          {
                            data: () => ({ documents: [{ name: "a.pdf", path: "lines/1/a.pdf" }] }),
                          },
                          { data: () => ({ documents: [] }) },
                        ],
                      }),
                    }),
                  },
                },
              ],
            }),
          }),
        }),
      },
    });

    await expect(getFirebaseSummary("user@example.com")).resolves.toEqual({
      configured: true,
      hasData: true,
      lineCount: 1,
      eventCount: 2,
      documentCount: 1,
    });
  });

  it("returns a readable error instead of throwing when Firebase lookup fails", async () => {
    isFirebaseConfigured.mockReturnValue(true);
    getFirebaseServices.mockResolvedValue({
      auth: {
        getUserByEmail: vi.fn().mockResolvedValue({ uid: "uid-1" }),
      },
      db: {
        collection: vi.fn().mockImplementation(() => {
          throw new Error("Cannot read properties of undefined (reading 'SDK_VERSION')");
        }),
      },
    });

    await expect(getFirebaseSummary("user@example.com")).resolves.toEqual({
      configured: true,
      hasData: false,
      lineCount: 0,
      eventCount: 0,
      documentCount: 0,
      error: "Could not read data from the old app. Please try again later.",
    });
  });
});
