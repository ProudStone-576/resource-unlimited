import { defineConfig, devices } from '@playwright/test';

// Smoke E2E for the marketing homepage interactivity.
// Reuses an already-running dev server on :3000 if present, else starts one.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Disables hero autoplay (suppressed under reduced-motion) so slide state
    // is deterministic for assertions.
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
