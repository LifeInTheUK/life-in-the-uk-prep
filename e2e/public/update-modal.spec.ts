import { test, expect } from "@playwright/test";

test("shows update modal with the release message when server reports a different build, hides on dismiss", async ({
  page,
}) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      json: { sha: "deadbee", message: "Fixed a bug", releasedAt: Date.now() },
    }),
  );

  await page.goto("/");

  const modal = page.locator("#update-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByText("New version available")).toBeVisible();
  await expect(modal.getByText("Fixed a bug")).toBeVisible();

  await modal.getByRole("button", { name: "Not now" }).click();
  await expect(modal).not.toBeVisible();
});

test("shows a generic message when the release has no commit message", async ({
  page,
}) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({ json: { sha: "deadbee", message: null, releasedAt: null } }),
  );

  await page.goto("/");

  const modal = page.locator("#update-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByText("The app has been updated.")).toBeVisible();
});

test("clicking Refresh reloads the page", async ({ page }) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      json: { sha: "deadbee", message: "Fixed a bug", releasedAt: Date.now() },
    }),
  );

  await page.goto("/");

  const modal = page.locator("#update-modal");
  await expect(modal).toBeVisible();

  // A marker set on window only survives until the next full reload - SPA
  // (client-side) navigation would never clear it, so its disappearance
  // proves window.location.reload() actually fired.
  await page.evaluate(() => {
    (window as unknown as { __e2eMarker: boolean }).__e2eMarker = true;
  });

  await Promise.all([
    page.waitForEvent("load"),
    modal.getByRole("button", { name: "Refresh" }).click(),
  ]);

  const markerSurvived = await page.evaluate(
    () => (window as unknown as { __e2eMarker?: boolean }).__e2eMarker,
  );
  expect(markerSurvived).toBeUndefined();
});

test("does not show the modal while a quiz question is in progress", async ({
  page,
}) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      json: { sha: "deadbee", message: "Fixed a bug", releasedAt: Date.now() },
    }),
  );

  await page.goto("/test");
  await expect(
    page.locator('[role="radiogroup"] button, [role="group"] button').first(),
  ).toBeVisible();

  await expect(page.locator("#update-modal")).not.toBeVisible();
});
