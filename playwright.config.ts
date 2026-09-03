/**
 * Playwright configuration.
 *
 * In this sandbox, Chromium is supplied via CHROMIUM_PATH (a headless
 * Chromium binary plus LD_LIBRARY_PATH for its bundled NSS libs). CI with a
 * standard Playwright browser install works without any environment
 * variables — the executablePath/env overrides are only applied when
 * CHROMIUM_PATH is set.
 */
import { defineConfig } from '@playwright/test';

const chromiumPath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  workers: process.env.CI ? 2 : 4,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    ...(chromiumPath
      ? {
          launchOptions: {
            executablePath: chromiumPath,
            args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'],
            env: {
              ...process.env,
              LD_LIBRARY_PATH: process.env.CHROMIUM_LD_LIBRARY_PATH ?? '',
            },
          },
        }
      : {}),
  },
});
