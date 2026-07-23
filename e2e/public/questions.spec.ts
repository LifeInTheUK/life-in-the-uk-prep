import { test, expect } from "@playwright/test";

test("browse questions by topic and search", async ({ page }) => {
  await page.goto("/questions");

  const topicChips = page.getByRole("link").filter({ hasText: /\d+$/ });
  await expect(topicChips.first()).toBeVisible();

  const secondTopic = topicChips.nth(1);
  await secondTopic.click();
  await expect(page).toHaveURL(/topic=/);

  await page.getByPlaceholder("Search questions...").fill("British");
  await expect(page).toHaveURL(/q=British/);
});
