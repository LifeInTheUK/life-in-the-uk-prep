import { test, expect } from "@playwright/test";

async function answerCurrentQuestion(page: import("@playwright/test").Page) {
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
}

test("Start Test from home starts a fresh session, not the stale results screen", async ({
  page,
}) => {
  await page.goto("/test");

  // Finish the whole session (NEXT_PUBLIC_SESSION_SIZE=3 in dev env).
  for (let i = 0; i < 10; i++) {
    if (await page.locator("#result-score").isVisible().catch(() => false)) break;
    await answerCurrentQuestion(page);
    await page.locator("#next-btn").click();
  }
  await expect(page.locator("#result-score")).toBeVisible();

  await page.getByRole("link", { name: "Life in the UK Prep" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: /start test/i }).click();
  await expect(page).toHaveURL("/test");

  // Bug: without a fix this still shows the completed results screen instead
  // of a fresh active question.
  await expect(page.locator("#result-score")).not.toBeVisible();
  await expect(page.locator("#question-heading")).toBeVisible();
});
