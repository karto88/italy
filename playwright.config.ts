import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// .env ჩატვირთვა
dotenv.config();

/**
 * Playwright Configuration — ITALY KYB/KYC პორტალი
 * ბრაუზერი იხსნება სრულ ეკრანზე
 */
export default defineConfig({
  testDir: './tests',

  /* ერთი ტესტის მაქსიმალური დრო — 2 წუთი */
  timeout: 120000,

  /* ტესტები სერიულად (KYB/KYC flow-ები ერთ user-ს ეხება) */
  fullyParallel: false,
  workers: 1,

  forbidOnly: false,
  retries: 0,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // custom summary → docs/report/index.html (GitHub Pages-ისთვის)
    ['./scripts/summary-reporter.js', { outputFile: 'docs/report/index.html' }],
  ],

  use: {
    /* Base URL — ყველა page.goto('/...') აქედან იწყება */
    baseURL: process.env.BASE_URL || 'https://dev.portal.keepz.it',

    /* ბრაუზერი ყოველთვის იხსნება ხილულად (headed) */
    headless: false,

    actionTimeout: 15000,
    navigationTimeout: 30000,

    /* Trace/screenshot მხოლოდ ჩავარდნისას */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chrome',
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
    },
  ],
});
