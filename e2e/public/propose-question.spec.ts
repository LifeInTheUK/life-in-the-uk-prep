import { test, expect } from "@playwright/test";

test("signed-out /propose-question shows the sign-in nudge, not the form", async ({ page }) => {
  await page.goto("/propose-question");

  await expect(
    page.getByText("Sign in to propose a question"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit proposal" })).not.toBeVisible();
});
