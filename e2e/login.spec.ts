import { expect, test } from "@playwright/test";

test.describe("login smoke", () => {
  test("renders the sign-in form", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
});
