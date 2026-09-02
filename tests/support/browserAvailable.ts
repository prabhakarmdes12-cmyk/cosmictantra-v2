/**
 * Shared guard for specs that need a real browser.
 *
 * The CI sandbox this repository is developed in cannot download Chromium
 * (the Playwright CDN is unreachable), so browser-driven specs would fail
 * there for environmental reasons and say nothing about the product. Every
 * browser flow is therefore wrapped in `test.skip(!browserAvailable(), …)`:
 * it runs on any machine with the browsers installed — including the
 * maintainer's — and reports a clean skip where they are absent.
 *
 * The non-browser half of each spec (source contracts, pipeline gates,
 * catalog integrity) always runs, so the suite still fails loudly when the
 * feature itself regresses.
 */
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';

let cached: boolean | null = null;

export function browserAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    cached = fs.existsSync(chromium.executablePath());
  } catch {
    cached = false;
  }
  return cached;
}

export const BROWSER_SKIP_REASON = 'chromium executable not installed in this environment';
