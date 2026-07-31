import { test, expect } from "@playwright/test";

test("shows Google button and defaults to sign-in mode", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  // Two buttons share the "Sign in" name (mode toggle + submit) — submit is the last one in the DOM.
  await expect(page.getByRole("button", { name: "Sign in", exact: true }).last()).toBeDisabled();
});

test("?mode=signup opens create-account mode with name/confirm fields", async ({ page }) => {
  await page.goto("/sign-in?mode=signup");

  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
});

test("tab toggle switches between sign-in and sign-up", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign-up submit stays disabled until fields are valid, flags mismatched passwords", async ({ page }) => {
  await page.goto("/sign-in?mode=signup");

  // Two buttons share the "Create account" name (mode toggle + submit) — submit is the last one in the DOM.
  const submit = page.getByRole("button", { name: "Create account", exact: true }).last();
  await expect(submit).toBeDisabled();

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password124");

  await expect(page.getByText("Passwords don't match.")).toBeVisible();
  await expect(submit).toBeDisabled();

  await page.getByLabel("Confirm password").fill("password123");
  await expect(submit).toBeEnabled();
});

test("sign-in submit stays disabled for short password", async ({ page }) => {
  await page.goto("/sign-in");

  // Two buttons share the "Sign in" name (mode toggle + submit) — submit is the last one in the DOM.
  const submit = page.getByRole("button", { name: "Sign in", exact: true }).last();
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");

  await expect(submit).toBeDisabled();
});

test("forgot password flow: request step, then reset step with validation", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByText("Forgot password?").click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();

  const sendButton = page.getByRole("button", { name: "Send reset code" });
  await expect(sendButton).toBeDisabled();

  await page.getByLabel("Email").fill("test@example.com");
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  await expect(page.getByLabel("Reset code")).toBeVisible();
  const resetButton = page.getByRole("button", { name: "Reset password" });
  await expect(resetButton).toBeDisabled();

  await page.getByLabel("Reset code").fill("123456");
  await page.getByLabel("New password", { exact: true }).fill("newpassword123");
  await page.getByLabel("Confirm new password").fill("mismatch1");
  await expect(page.getByText("Passwords don't match.")).toBeVisible();
  await expect(resetButton).toBeDisabled();

  await page.getByLabel("Confirm new password").fill("newpassword123");
  await expect(resetButton).toBeEnabled();
});

test("forgot password 'Back to sign in' returns to the sign-in form", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByText("Forgot password?").click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();

  await page.getByText("Back to sign in").click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
