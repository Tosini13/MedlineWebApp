import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "./auth.api";
import {
  applyAuthStateChange,
  authKeys,
  clearCurrentUserCache,
  resolveCurrentUser,
  setCurrentUserCache,
} from "./auth.queries";

vi.mock("./auth.api", () => ({
  fetchCurrentUser: vi.fn(),
}));

describe("resolveCurrentUser", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(fetchCurrentUser).mockReset();
  });

  it("fetches the user when the cache is empty", async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({ id: "u1", email: "a@b.com" });

    const user = await resolveCurrentUser(queryClient);

    expect(user).toEqual({ id: "u1", email: "a@b.com" });
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("returns the cached user without refetching on subsequent navigations", async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({ id: "u1", email: "a@b.com" });

    await resolveCurrentUser(queryClient);
    const user = await resolveCurrentUser(queryClient);

    expect(user).toEqual({ id: "u1", email: "a@b.com" });
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("returns cached null without refetching", async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(null);

    await resolveCurrentUser(queryClient);
    const user = await resolveCurrentUser(queryClient);

    expect(user).toBeNull();
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("refetches after the user cache is cleared", async () => {
    vi.mocked(fetchCurrentUser)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com" })
      .mockResolvedValueOnce(null);

    await resolveCurrentUser(queryClient);
    clearCurrentUserCache(queryClient);
    const user = await resolveCurrentUser(queryClient);

    expect(user).toBeNull();
    expect(fetchCurrentUser).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(authKeys.user)).toBeNull();
  });
});

describe("applyAuthStateChange", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("on SIGNED_OUT clears cached data, seeds user null, and signals a router refresh", () => {
    setCurrentUserCache(queryClient, { id: "u1", email: "a@b.com" });
    queryClient.setQueryData(["lines"], [{ id: "line-1" }]);

    const shouldRefreshRouter = applyAuthStateChange("SIGNED_OUT", queryClient);

    expect(shouldRefreshRouter).toBe(true);
    expect(queryClient.getQueryData(authKeys.user)).toBeNull();
    expect(queryClient.getQueryData(["lines"])).toBeUndefined();
  });

  it("ignores non-sign-out events", () => {
    setCurrentUserCache(queryClient, { id: "u1", email: "a@b.com" });
    queryClient.setQueryData(["lines"], [{ id: "line-1" }]);

    for (const event of [
      "INITIAL_SESSION",
      "SIGNED_IN",
      "TOKEN_REFRESHED",
      "USER_UPDATED",
    ] as const) {
      expect(applyAuthStateChange(event, queryClient)).toBe(false);
    }

    expect(queryClient.getQueryData(authKeys.user)).toEqual({ id: "u1", email: "a@b.com" });
    expect(queryClient.getQueryData(["lines"])).toEqual([{ id: "line-1" }]);
  });
});
