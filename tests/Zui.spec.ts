import { test, expect, Locator } from "@playwright/test";
import { delay } from "../src/util";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

// TODO these tests are flaky
test.describe("Islands", () => {
  let groupLocator: Locator;
  test.beforeEach(async ({ page }) => {
    groupLocator = page.locator("[description=Islands]");
    // TODO try to remove need for this
    await delay(1000);
  });

  test("basic", async () => {
    const locator = groupLocator.locator("[test=basic]");

    await expect(locator).toBeVisible();
  });

  test("with z-show", async ({ page }) => {
    const locator = groupLocator.locator(`[test="z-show"]`);
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

  test("with z-click", async () => {
    const locator = groupLocator.locator(`[test="z-click"]`);

    const button = locator.locator("button");

    await button.click();

    await expect(locator).toHaveText(/Clicked/);
  });

  test("interpolation", async () => {
    const locator = groupLocator.locator(`[test="interpolation"]`);

    await expect(locator).toHaveText(/My favorite number is 0!/);

    const button = locator.locator("button");

    await button.click();

    await expect(locator).toHaveText(/My favorite number is 1!/);
  });

  test("z-show+interpolation", async ({ page }) => {
    const locator = groupLocator.locator(`[test="z-show+interpolation"]`);

    const button = page.locator("#togglePigWings");

    await button.click();

    await expect(locator).toHaveText(/My favorite number is 0!/);
  });

  test("with props", async ({ page }) => {
    const locator = groupLocator.locator(`[test="props"]`);

    await expect(locator).toHaveText(/Yes, pigs are just pigs/);

    const button = page.locator("#togglePigWings");

    await button.click();

    await expect(locator).toHaveText(/Yes, pigs can fly/);
  });
});

test.describe("directives", () => {
  let groupLocator: Locator;
  test.beforeEach(async ({ page }) => {
    groupLocator = page.locator("[description=directives]");
    // TODO try to remove need for this
    await delay(1000);
  });
  test("z-map", async () => {
    const locator = groupLocator.locator(`[test="z-map"]`);

    const colorPatterns = ["akai", "aoui", "shiroi"].map((s) => new RegExp(s));

    for (const pattern of colorPatterns) {
      await expect(locator).toHaveText(pattern);
    }

    const input = locator.locator("input");

    await input.fill("kiiroi");
    locator.dispatchEvent("submit");

    colorPatterns.push(new RegExp("kiiroi"));
    await expect(locator).toHaveText(colorPatterns.at(-1)!);

    const patternToRemove = colorPatterns.at(2)!;
    const itemToRemove = locator.locator("li", { hasText: patternToRemove });

    await itemToRemove.click();

    await expect(locator).not.toHaveText(patternToRemove);
  });
});
