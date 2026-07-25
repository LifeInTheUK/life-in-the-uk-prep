import { test, expect } from "@playwright/test";

test("homepage loads and shows a CTA to start a test", async ({ page }) => {
  await page.goto("/");
  // "Start Test" is a button (it must call restart() to clear any stale
  // completed-session state); "Continue Test" is a plain link (resumes the
  // in-progress session already held in the layout-level QuizProvider).
  await expect(
    page.getByRole("button", { name: /start test/i }).or(
      page.getByRole("link", { name: /continue test/i }),
    ),
  ).toBeVisible();
});
