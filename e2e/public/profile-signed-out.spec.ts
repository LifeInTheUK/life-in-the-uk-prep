import { test, expect } from "@playwright/test";

test("signed-out /profile shows the sign-in nudge, not stats", async ({ page }) => {
  await page.goto("/profile");

  await expect(
    page.getByText("Sign in to see your full profile"),
  ).toBeVisible();
  await expect(page.getByText("Your progress")).not.toBeVisible();
});
