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

    const button = page.locator("#toggleButton");

    await button.click();
    await expect(locator).toBeVisible();

    await button.click();
    await expect(locator).not.toBeVisible();

    await button.click();
    await expect(locator).toBeVisible();

    await button.click();
    await expect(locator).not.toBeVisible();
  });

  test("with events", async () => {
    const locator = groupLocator.locator(`[test="events"]`);

    const button1 = locator.locator("[z-click=handleClick]");
    const button2 = locator.locator("[z-click=handleClock]");

    await button1.click();
    await button2.click();
    delay(20);

    await expect(button1).toHaveText(/Clicked/);
    await expect(button2).toHaveText(/Clocked/);
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

    const button = page.locator("#toggleButton");

    await button.click();

    await expect(locator).toHaveText(/My favorite number is 0!/);
  });

  test("with props", async ({ page }) => {
    const locator = groupLocator.locator(`[test="props"]`);

    await expect(locator).toHaveText(/Yes, pigs are just pigs/);

    const button = page.locator("#toggleButton");

    await button.click();

    await expect(locator).toHaveText(/Yes, pigs can fly/);
  });
});

test.describe("interpolation", () => {
  let groupLocator: Locator;
  test.beforeEach(async ({ page }) => {
    groupLocator = page.locator("[description=interpolation]");
    // TODO try to remove need for this
    await delay(1000);
  });

  test("in text nodes", async () => {
    const locator = groupLocator.locator(`[test="text"]`);
    await expect(locator).toHaveText("what happens if I include $message?");
  });

  test("in attribute nodes", async () => {
    const locator = groupLocator.locator(`[test="attribute"]`);
    await expect(locator).toHaveValue("what happens if I include $message?");
  });
});

test.describe("directives", () => {
  let groupLocator: Locator;
  let toggleButtonLocator: Locator;
  test.beforeEach(async ({ page }) => {
    groupLocator = page.locator("[description=directives]");
    toggleButtonLocator = page.locator("#toggleButton");
    // TODO try to remove need for this
    await delay(1000);
  });
  // TODO why are these failing??
  // test("z-show", async () => {
  //   const locator = groupLocator.locator(`[test="z-show"]`);

  //   expect(locator.locator('[test-id="0"]')).toBeVisible();
  //   expect(locator.locator('[test-id="1"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="2"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="3"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="4"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="5"]')).toBeVisible();

  //   await toggleButtonLocator.click();

  //   expect(locator.locator('[test-id="0"]')).toBeVisible();
  //   expect(locator.locator('[test-id="1"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="2"]')).toBeVisible();
  //   expect(locator.locator('[test-id="3"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="4"]')).not.toBeVisible();
  //   expect(locator.locator('[test-id="5"]')).toBeVisible();
  // });

  test("z-class", async () => {
    const locator = groupLocator.locator(`[test="z-class"]`);

    await expect(locator).not.toHaveClass("goofy");

    await toggleButtonLocator.click();

    await expect(locator).toHaveClass("goofy");
  });
});
