import { test, expect } from "@playwright/test";

test("review page renders without error", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Review answers" })).toBeVisible();
});
