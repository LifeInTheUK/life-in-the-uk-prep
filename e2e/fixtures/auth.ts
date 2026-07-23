import { test as base, type Page } from "@playwright/test";

const FAKE_SESSION = {
  session: {
    id: "e2e-session-id",
    userId: "e2e-user-id",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  },
  user: {
    id: "e2e-user-id",
    name: "E2E Test User",
    email: "e2e-test-user@example.com",
    image: null,
  },
};

// Intercepts the better-auth client's session-check request so client-rendered
// UI (header avatar, SignInNudge, SignInPromptModal) behaves as if signed in.
// Does NOT affect server-side auth.getSession() calls inside API routes
// (/api/progress, /api/history, /api/account) - those hit the hosted Neon Auth
// backend directly and are unmocked, so no real progress/history rows get written.
export async function mockSignedIn(page: Page) {
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({ json: FAKE_SESSION })
  );
}

export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    await mockSignedIn(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
