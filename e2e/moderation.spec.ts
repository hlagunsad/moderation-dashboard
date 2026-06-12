import { test, expect, type Page } from "@playwright/test";

// Demo credentials come from .env.local (loaded in playwright.config.ts):
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
//   E2E_MOD_EMAIL   / E2E_MOD_PASSWORD
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@demo.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const MOD_EMAIL = process.env.E2E_MOD_EMAIL ?? "mod@demo.test";
const MOD_PASSWORD = process.env.E2E_MOD_PASSWORD ?? "";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // "Sign out" only exists on the dashboard, so this confirms we're authenticated.
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test("admin sees the review queue and the admin-only Ban action", async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page.getByRole("button", { name: "Review queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ban user" }).first()).toBeVisible();
});

test("moderator can act but cannot see the Ban action (RBAC)", async ({ page }) => {
  await signIn(page, MOD_EMAIL, MOD_PASSWORD);
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Ban user" })).toHaveCount(0);
});
