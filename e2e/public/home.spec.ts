import { test, expect } from "@playwright/test";

test("homepage loads and shows a CTA to start a test", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /start test|continue test/i }),
  ).toBeVisible();
});
