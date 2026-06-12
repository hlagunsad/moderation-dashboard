import { test, expect, type Page } from "@playwright/test";

// Throwaway demo credentials — intentionally public (shown on the sign-in page
// of the live demo). Overridable via E2E_* env vars.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@demo.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "lolom0panot123";
const MOD_EMAIL = process.env.E2E_MOD_EMAIL ?? "mod@demo.test";
const MOD_PASSWORD = process.env.E2E_MOD_PASSWORD ?? "lolom0panot098";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // "Sign out" only exists on the dashboard, so this confirms authentication.
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test("admin signs in and sees the review queue", async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  await expect(page.getByRole("button", { name: "Review queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Audit log" })).toBeVisible();
});

test("moderator cannot see the admin-only Ban action (RBAC)", async ({ page }) => {
  await signIn(page, MOD_EMAIL, MOD_PASSWORD);
  await expect(page.getByText(MOD_EMAIL)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ban user" })).toHaveCount(0);
});
