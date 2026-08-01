import { test, expect } from "../fixtures/auth";

test("header shows avatar/profile link instead of sign-in when mock-signed-in", async ({
  signedInPage: page,
}) => {
  await page.goto("/");

  // exact: true disambiguates from HomePage's "Your profile" nav card link,
  // which has the same substring in its accessible name (title + subtitle)
  // but points to the same /profile destination — not a real collision.
  await expect(
    page.getByRole("link", { name: "Your profile", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).not.toBeVisible();
});
