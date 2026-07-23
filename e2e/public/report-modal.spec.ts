import { test, expect } from "@playwright/test";

async function openReportModal(page: import("@playwright/test").Page) {
  await page.goto("/test");
  const optionButtons = page.locator('[role="radiogroup"] button, [role="group"] button');
  const submitMultiBtn = page.locator("#submit-multi-btn");
  await expect(optionButtons.first()).toBeVisible();
  if (await submitMultiBtn.count()) {
    const count = await optionButtons.count();
    for (let i = 0; i < count && !(await submitMultiBtn.isEnabled()); i++) {
      await optionButtons.nth(i).click();
    }
    await submitMultiBtn.click();
  } else {
    await optionButtons.first().click();
  }
  await page.getByRole("button", { name: "Report an issue with this question" }).click();
}

test("selecting Other reveals a 200-char-limited textarea and gates Submit", async ({ page }) => {
  await openReportModal(page);

  const submitBtn = page.getByRole("button", { name: "Submit" });
  await page.getByRole("button", { name: "Other" }).click();
  await expect(submitBtn).toBeDisabled();

  const textarea = page.locator("textarea");
  await expect(textarea).toBeVisible();
  await textarea.fill("a".repeat(250));
  await expect(textarea).toHaveValue("a".repeat(200));
  await expect(page.getByText("200/200")).toBeVisible();

  await expect(submitBtn).toBeEnabled();
});

test("non-Other categories don't show the textarea and submit without it", async ({ page }) => {
  await openReportModal(page);

  await page.getByRole("button", { name: "Typo / spelling" }).click();
  await expect(page.locator("textarea")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
});
