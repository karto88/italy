import { test as base } from '@playwright/test';
import { NuveiFlowHelper } from './NuveiFlowHelper';

/**
 * Nuvei fixture — `flow` (NuveiFlowHelper).
 *   import { test, expect } from '../../utils/nuveiFixture';
 *   test('...', async ({ flow }) => { await flow.completeOnboarding({...}); });
 *
 * ℹ️ ნომრებს არ ვშლით — nextPhone() pool.
 */
type NuveiFixtures = { flow: NuveiFlowHelper };

export const test = base.extend<NuveiFixtures>({
  flow: async ({ page }, use) => {
    const flow = new NuveiFlowHelper(page);
    await use(flow);
    // HOLD=1 → ბრაუზერი ღიად რჩება; სხვა შემთხვევაში 5წმ
    if (process.env.HOLD) {
      await page.pause();
    } else {
      await page.waitForTimeout(5000);
    }
  },
});

export { expect } from '@playwright/test';