import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Islands: basic", async ({ page }) => {
  await expect(page.locator("basic")).toBeVisible();
});
