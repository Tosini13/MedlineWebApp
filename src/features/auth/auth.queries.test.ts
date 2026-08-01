import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "./auth.api";
import { authKeys, clearCurrentUserCache, resolveCurrentUser } from "./auth.queries";

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
