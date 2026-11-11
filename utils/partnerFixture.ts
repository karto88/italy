import { test as base } from '@playwright/test';
import { PartnerApi } from './PartnerApi';
import { PartnerKybApi } from './PartnerKybApi';
import { PreloadFlowHelper } from './PreloadFlowHelper';
import { PreloadKybFlowHelper } from './PreloadKybFlowHelper';

/**
 * Partner fixture — `partner` (PartnerApi), KeepzWalletService v2 (KI-456).
 * token ერთხელ მოდის worker-ზე (auth §7.1), ამიტომ სპეკ-ფაილებში hooks აღარ საჭიროა.
 * `partnerKyb` (PartnerKybApi) — იგივე, KYB (§7.9 prePopulateKyb).
 * `preloadKyb` (PreloadKybFlowHelper) — იგივე merchant-ისთვის (KYB).
 * `preload` (PreloadFlowHelper) — იგივე partner + ბრაუზერი: pre-loaded onboarding პორტალში (KI-481).
 *
 *   import { test } from '../../utils/partnerFixture';
 *   test('...', async ({ partner }) => { await partner.prePopulateNewIndividual(); });
 *   test('...', async ({ preload }) => { await preload.completePreloadedOnboarding(); });
 */
type PartnerFixtures = { partner: PartnerApi; partnerKyb: PartnerKybApi };
type PreloadFixtures = { preload: PreloadFlowHelper; preloadKyb: PreloadKybFlowHelper };

export const test = base.extend<PreloadFixtures, PartnerFixtures>({
  partner: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      const partner = new PartnerApi(context);
      await partner.auth();
      await use(partner);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
  partnerKyb: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      const partnerKyb = new PartnerKybApi(context);
      await partnerKyb.auth();
      await use(partnerKyb);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
  preload: async ({ page, partner }, use) => {
    await use(new PreloadFlowHelper(page, partner));
    // 3 წამი შედეგის სანახავად, მერე ბრაუზერი იხურება
    await page.waitForTimeout(3000);
  },
  preloadKyb: async ({ page, partnerKyb }, use) => {
    await use(new PreloadKybFlowHelper(page, partnerKyb));
    await page.waitForTimeout(3000);
  },
});

export { expect } from '@playwright/test';
