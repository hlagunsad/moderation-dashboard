import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load NEXT_PUBLIC_* (for the dev server) and the E2E_* demo credentials.
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
