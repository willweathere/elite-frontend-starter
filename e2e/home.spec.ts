import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Elite Frontend Starter" }),
    ).toBeVisible();
  });

  test("has no obvious accessibility landmarks missing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("renders a WebGL canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas").first()).toBeVisible();
  });
});
