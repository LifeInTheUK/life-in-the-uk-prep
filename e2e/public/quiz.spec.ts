import { test, expect } from "@playwright/test";

// Questions are randomized per session and can be single- or multi-select,
// so this handles both shapes rather than assuming a single-select question.
test("answer a question and see feedback", async ({ page }) => {
  await page.goto("/test");

  const optionButtons = page.locator('[role="radiogroup"] button, [role="group"] button');
  await expect(optionButtons.first()).toBeVisible();

  const submitMultiBtn = page.locator("#submit-multi-btn");
  if (await submitMultiBtn.count()) {
    const count = await optionButtons.count();
    for (let i = 0; i < count && !(await submitMultiBtn.isEnabled()); i++) {
      await optionButtons.nth(i).click();
    }
    await submitMultiBtn.click();
  } else {
    await optionButtons.first().click();
  }

  await expect(
    page.getByText(/^correct$/i).or(page.getByText(/^incorrect$/i)),
  ).toBeVisible();
});
