import { expect, test } from "@playwright/test";

test.describe("signup smoke", () => {
  test("renders the create-account form", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto("/signup");

    await expect(page.getByText("Create your account")).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
