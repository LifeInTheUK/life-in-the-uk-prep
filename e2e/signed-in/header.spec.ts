import { test, expect } from "../fixtures/auth";

test("header shows avatar/profile link instead of sign-in when mock-signed-in", async ({
  signedInPage: page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Your profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).not.toBeVisible();
});
