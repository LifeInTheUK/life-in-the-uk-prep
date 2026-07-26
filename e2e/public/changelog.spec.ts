import { test, expect } from "@playwright/test";

test("changelog page renders without error", async ({ page }) => {
  await page.goto("/changelog");
  await expect(
    page.getByRole("heading", { name: "Changelog" }),
  ).toBeVisible();
  // No releases exist against the dev DATABASE_URL - record-release.ts only
  // ever inserts on a production Vercel build - so the empty state is what
  // both dev and CI will actually show.
  await expect(page.getByText("No releases recorded yet.")).toBeVisible();
});
