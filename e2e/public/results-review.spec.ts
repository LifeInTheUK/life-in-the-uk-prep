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

async function completeSession(page: import("@playwright/test").Page) {
  for (let i = 0; i < 30; i++) {
    if (await page.locator("#result-score").isVisible().catch(() => false)) break;
    await answerCurrentQuestion(page);
    await page.locator("#next-btn").click();
  }
  await expect(page.locator("#result-score")).toBeVisible();
  // Signed-out completions raise SignInPromptModal, whose backdrop swallows
  // clicks on the results screen underneath.
  // It renders once the session check resolves, i.e. slightly after the
  // results screen itself — wait for it rather than probing immediately.
  const notNow = page.getByRole("button", { name: "Not now" });
  await expect(notNow).toBeVisible();
  await notNow.click();
  await expect(notNow).toHaveCount(0);
}

// The session length is set by NEXT_PUBLIC_SESSION_SIZE, which only the Next
// server reads — the test runner's own env doesn't see .env.local. Read the
// real total off the results screen ("<score> / <total>") instead of guessing.
async function sessionTotal(page: import("@playwright/test").Page): Promise<number> {
  const text = await page.locator("#result-score + span").innerText();
  return Number(text.replace(/\D/g, ""));
}

test("results screen reveals every answered question via Review answers", async ({ page }) => {
  await page.goto("/test");
  await completeSession(page);

  const reviewBtn = page.locator("#review-answers-btn");
  await expect(reviewBtn).toHaveText("Review answers");
  await expect(page.locator("#session-review-list")).toHaveCount(0);

  await reviewBtn.click();

  const rows = page.locator("#session-review-list > li");
  await expect(rows).toHaveCount(await sessionTotal(page));
  await expect(reviewBtn).toHaveText("Back to results");

  // Each row carries a correct/incorrect verdict; expanding one shows the
  // correct answer plus the explanation.
  await expect(rows.first().getByText(/^(Correct|Incorrect)$/)).toBeVisible();
  await rows.first().locator("summary").click();
  await expect(rows.first().getByText("Correct answer:")).toBeVisible();

  // Home/Restart stay reachable while reviewing.
  await expect(page.locator("#restart-btn")).toBeVisible();
  await expect(page.locator("#home-btn")).toBeVisible();

  await reviewBtn.click();
  await expect(page.locator("#session-review-list")).toHaveCount(0);
});

test("review list does not leak into the next test's results", async ({ page }) => {
  await page.goto("/test");
  await completeSession(page);

  await page.locator("#review-answers-btn").click();
  await expect(page.locator("#session-review-list > li")).toHaveCount(await sessionTotal(page));

  await page.locator("#restart-btn").click();
  await expect(page.locator("#question-heading")).toBeVisible();
  await expect(page.locator("#session-review")).toHaveCount(0);

  await completeSession(page);
  // Collapsed again for the new results screen, and holding only the new
  // session's answers — not the previous session's appended to them.
  await expect(page.locator("#session-review")).toHaveCount(0);
  await expect(page.locator("#review-answers-btn")).toHaveText("Review answers");
  await page.locator("#review-answers-btn").click();
  await expect(page.locator("#session-review-list > li")).toHaveCount(await sessionTotal(page));
});
