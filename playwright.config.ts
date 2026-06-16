import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Assumes the app is served at BASE_URL (default :3000). Run with:
 *   npm run build && npm run start &   # serve production build
 *   npm run test:e2e
 * Requires `npx playwright install` once for browser binaries.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
