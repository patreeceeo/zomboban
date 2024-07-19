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

  // TODO test z-show independently of Islands
  test("using z-show", async ({ page }) => {
    const locator = groupLocator.locator(`[test="using z-show"]`);
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

test.describe("Attribute directives", () => {
  let groupLocator: Locator;
  test.beforeEach(({ page }) => {
    groupLocator = page.locator(`[description="Attribute directives"]`);
  });
  test("using z-click", async () => {
    const locator = groupLocator.locator(`[test="using z-click"]`);

    const button = locator.locator("button");

    await button.click();

    await expect(locator).toHaveText(/Clicked/);
  });
});
