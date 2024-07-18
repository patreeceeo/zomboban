import { test, expect, Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

// TODO test hot reloading?
test.describe("Islands", () => {
  let groupLocator: Locator;
  test.beforeEach(({ page }) => {
    groupLocator = page.locator("[description=Islands]");
  });
  test("basic", async () => {
    const locator = groupLocator.locator("[test=basic]");

    await expect(locator).toBeVisible();
  });

  test("using x-show", async ({ page }) => {
    const locator = groupLocator.locator(`[test="using x-show"]`);
    await expect(locator).toBeEmpty();

    const button = page.locator("#togglePigWings");

    await button.click();
    await expect(locator).toBeVisible();

    await button.click();
    await expect(locator).not.toBeVisible();

    await button.click();
    await expect(locator).toBeVisible();

    await button.click();
    await expect(locator).not.toBeVisible();
  });
});
