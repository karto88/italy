import { test as base } from '@playwright/test';
import { WalletFlowHelper } from './WalletFlowHelper';

/**
 * Business fixture — `flow` (WalletFlowHelper).
 * setup/teardown აქ ხდება, ამიტომ სპეკ-ფაილებში hooks აღარ საჭიროა.
 *
 *   import { test, expect } from '../../utils/businessFixture';
 *   test('...', async ({ flow }) => { await flow.completeOnboarding(); });
 *
 * ℹ️ ნომრებს აღარ ვშლით — nextPhone() pool-იდან ყოველ run-ზე ახალ (whitelisted) ნომერს იღებს.
 */
type BusinessFixtures = { flow: WalletFlowHelper };

export const test = base.extend<BusinessFixtures>({
  flow: async ({ page }, use) => {
    const flow = new WalletFlowHelper(page);
    await use(flow);

    // HOLD=1 → ბრაუზერი ღიად რჩება (Inspector); სხვა შემთხვევაში 5წმ
    if (process.env.HOLD) {
      await page.pause();
    } else {
      await page.waitForTimeout(5000);
    }
  },
});

export { expect } from '@playwright/test';