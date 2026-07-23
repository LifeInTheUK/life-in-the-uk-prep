import { test, expect } from "../fixtures/auth";

test("sign-in prompt modal does not appear on results screen when mock-signed-in", async ({
  signedInPage: page,
}) => {
  await page.goto("/test");

  const optionButtons = page.locator('[role="radiogroup"] button, [role="group"] button');
  const submitMultiBtn = page.locator("#submit-multi-btn");

  // NEXT_PUBLIC_SESSION_SIZE is set low for dev (see .env.local), so a full
  // session can be answered through in a loop within this test.
  for (let i = 0; i < 50; i++) {
    if (await page.getByText("Not now").isVisible().catch(() => false)) {
      throw new Error("Sign-in prompt appeared for a mock-signed-in session");
    }

    const nextButton = page.getByRole("button", { name: /next question|view results/i });
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      continue;
    }

    if (!(await optionButtons.first().isVisible().catch(() => false))) break;

    if (await submitMultiBtn.count()) {
      const count = await optionButtons.count();
      for (let j = 0; j < count && !(await submitMultiBtn.isEnabled()); j++) {
        await optionButtons.nth(j).click();
      }
      await submitMultiBtn.click();
    } else {
      await optionButtons.first().click();
    }
  }

  await expect(page.getByText("Not now")).not.toBeVisible();
});
