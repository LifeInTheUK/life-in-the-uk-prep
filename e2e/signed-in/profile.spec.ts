import { test, expect } from "../fixtures/auth";

// Mocks the client-side session check only; the server-side /api/progress and
// /api/history routes still see no real session, so history/progress data
// isn't available here. This test asserts the signed-in shell renders
// (identity block + nav cards), not real persisted data.
test("mock-signed-in /profile shows the profile shell instead of the sign-in nudge", async ({
  signedInPage: page,
}) => {
  await page.goto("/profile");

  await expect(page.getByRole("link", { name: /full statistics/i })).toBeVisible();
  await expect(
    page.getByText("Sign in to see your full profile"),
  ).not.toBeVisible();
});
