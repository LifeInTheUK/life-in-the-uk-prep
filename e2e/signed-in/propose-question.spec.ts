import { test, expect } from "../fixtures/auth";

// Mocks the client-side session check only; a real POST to
// /api/propose-question still 401s server-side (no real session), so this
// only covers the form shell + client-side validation UI, not a real submit.
test("mock-signed-in /propose-question shows the form instead of the sign-in nudge", async ({
  signedInPage: page,
}) => {
  await page.goto("/propose-question");

  await expect(page.getByRole("heading", { name: "Propose a question" })).toBeVisible();
  await expect(page.getByPlaceholder("e.g. What is the capital of Scotland?")).toBeVisible();
  await expect(page.getByText("+ Add option")).toBeVisible();
  await expect(
    page.getByText("Sign in to propose a question"),
  ).not.toBeVisible();
});

test("submit stays disabled until options are either empty or valid", async ({
  signedInPage: page,
}) => {
  await page.goto("/propose-question");

  const submit = page.getByRole("button", { name: "Submit proposal" });
  const question = page.getByPlaceholder("e.g. What is the capital of Scotland?");
  const options = page.getByPlaceholder(/^Option \d$/);

  // No question yet — disabled.
  await expect(submit).toBeDisabled();

  await question.fill("What is the capital of Scotland?");
  // Question only, no options filled — valid, enabled.
  await expect(submit).toBeEnabled();

  // Fill one option — now options are "provided" but incomplete (<2 non-empty).
  await options.nth(0).fill("Edinburgh");
  await expect(submit).toBeDisabled();

  // Fill a second option, still no answer checked.
  await options.nth(1).fill("Glasgow");
  await expect(submit).toBeDisabled();

  // Check the correct option — now valid.
  await page.getByLabel("Mark option 1 as correct").check();
  await expect(submit).toBeEnabled();
});
