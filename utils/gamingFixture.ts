import { test as base } from '@playwright/test';
import { AdminApi } from './AdminApi';
import { MerchantApi } from './MerchantApi';
import { GamingAccessFlow } from './GamingAccessFlow';

/**
 * Gaming fixture — `gaming` (GamingAccessFlow): ადმინი + მერჩანტი, ორივე დალოგინებული.
 * login ერთხელ worker-ზე; ბოლოს: შეცვლილი კომპანიების სტატუსი → ACTIVE,
 * და მერჩანტის gamingAccess → საწყისი არჩევანი (თუ ტესტმა შეცვალა).
 *
 *   import { test } from '../../utils/gamingFixture';
 *   test('...', async ({ gaming }) => { await gaming.companyStatusInPicker(gamingKo, 'INACTIVE'); });
 */
type GamingFixtures = { gaming: GamingAccessFlow };

export const test = base.extend<{}, GamingFixtures>({
  gaming: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      const admin = new AdminApi(context);
      const merchant = new MerchantApi(context);
      await admin.authenticate();
      await merchant.login();

      const gaming = new GamingAccessFlow(admin, merchant);
      await use(gaming);

      await gaming.restoreStatuses();
      if (gaming.accessChanged) await gaming.restoreAccess();
      await context.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
