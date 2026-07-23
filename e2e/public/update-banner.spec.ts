import { test, expect } from "@playwright/test";

test("shows update banner when server reports a different build, hides once dismissed", async ({
  page,
}) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({ json: { sha: "deadbee" } }),
  );

  // UpdateBanner defers to CookieBanner while consent is unresolved (both
  // dock to the same fixed-bottom corner) - pre-accept consent so this test
  // isolates the update-banner behavior.
  await page.addInitScript(() => {
    localStorage.setItem("ukTestCookieConsent", "accepted");
  });

  await page.goto("/");

  const banner = page.locator("#update-banner");
  await expect(banner).toBeVisible();
  await expect(banner.getByText("A new version is available.")).toBeVisible();

  await banner.getByRole("button", { name: "Dismiss" }).click();
  await expect(banner).not.toBeVisible();
});

test("clicking Refresh reloads the page", async ({ page }) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({ json: { sha: "deadbee" } }),
  );

  await page.addInitScript(() => {
    localStorage.setItem("ukTestCookieConsent", "accepted");
  });

  await page.goto("/");

  const banner = page.locator("#update-banner");
  await expect(banner).toBeVisible();

  // A marker set on window only survives until the next full reload - SPA
  // (client-side) navigation would never clear it, so its disappearance
  // proves window.location.reload() actually fired.
  await page.evaluate(() => {
    (window as unknown as { __e2eMarker: boolean }).__e2eMarker = true;
  });

  await Promise.all([
    page.waitForEvent("load"),
    banner.getByRole("button", { name: "Refresh" }).click(),
  ]);

  const markerSurvived = await page.evaluate(
    () => (window as unknown as { __e2eMarker?: boolean }).__e2eMarker,
  );
  expect(markerSurvived).toBeUndefined();
});

test("does not show the banner while a quiz question is in progress", async ({
  page,
}) => {
  await page.route("**/api/version", (route) =>
    route.fulfill({ json: { sha: "deadbee" } }),
  );

  // Pre-accept consent so this isolates the phase guard specifically -
  // without this, the banner would stay hidden purely from the consent gate
  // regardless of the phase check under test.
  await page.addInitScript(() => {
    localStorage.setItem("ukTestCookieConsent", "accepted");
  });

  await page.goto("/test");
  await expect(
    page.locator('[role="radiogroup"] button, [role="group"] button').first(),
  ).toBeVisible();

  await expect(page.locator("#update-banner")).not.toBeVisible();
});
