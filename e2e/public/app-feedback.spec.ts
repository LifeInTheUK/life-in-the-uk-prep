import { test, expect } from "@playwright/test";

test("send-feedback modal opens, gates Submit, and enforces the 200-char textarea limit", async ({ page }) => {
  await page.route("**/api/captcha", (route) =>
    route.fulfill({ json: { token: "e2e-fixed-token", question: "2 + 2" } }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Send feedback" }).click();

  const submitBtn = page.getByRole("button", { name: "Submit" });
  await expect(submitBtn).toBeDisabled();

  await expect(page.getByText("What is 2 + 2?")).toBeVisible();

  const textarea = page.locator("textarea");
  await textarea.fill("a".repeat(250));
  await expect(textarea).toHaveValue("a".repeat(200));
  await expect(submitBtn).toBeDisabled();

  await page.locator('input[type="number"]').fill("4");
  await expect(submitBtn).toBeEnabled();
});

test("submitting a correct answer succeeds", async ({ page }) => {
  await page.route("**/api/captcha", (route) =>
    route.fulfill({ json: { token: "e2e-fixed-token-2", question: "3 + 5" } }),
  );
  await page.route("**/api/app-feedback", (route) =>
    route.fulfill({ json: { ok: true } }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Send feedback" }).click();

  await page.locator("textarea").fill("This app is great.");
  await page.locator('input[type="number"]').fill("8");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Thanks — feedback sent")).toBeVisible();
});
