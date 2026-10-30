import { test as base } from '@playwright/test';
import { MerchantApi } from './MerchantApi';

/**
 * Payments fixture — `merchant` (MerchantApi), უკვე დალოგინებული.
 * login ერთხელ ხდება worker-ზე (OTP mailinator-იდან), ამიტომ სპეკ-ფაილებში hooks აღარ საჭიროა.
 *
 *   import { test } from '../../utils/paymentsFixture';
 *   test('...', async ({ merchant }) => { await merchant.transferPersonalToTechnical(); });
 */
type PaymentsFixtures = { merchant: MerchantApi };

export const test = base.extend<{}, PaymentsFixtures>({
  merchant: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      const merchant = new MerchantApi(context);
      await merchant.login();
      await use(merchant);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
