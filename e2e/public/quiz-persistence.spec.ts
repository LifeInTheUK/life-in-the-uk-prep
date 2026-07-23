import { test, expect } from "@playwright/test";

test("quiz session persists across navigation away and back", async ({ page }) => {
  await page.goto("/test");

  const optionButtons = page.locator('[role="radiogroup"] button, [role="group"] button');
  await expect(optionButtons.first()).toBeVisible();

  const questionText = await page
    .locator("#question-heading")
    .textContent();

  // Client-side navigation (not page.goto) is required here: the quiz engine
  // is a layout-level provider that only survives client-side route changes,
  // by design - a full page reload deliberately resets it (see CLAUDE.md).
  await page.getByRole("link", { name: "Life in the UK Prep" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: /continue test/i }).click();
  await expect(page).toHaveURL("/test");
  await expect(page.locator("#question-heading")).toHaveText(questionText ?? "");
});
