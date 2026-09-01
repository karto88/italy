import { test as base } from '@playwright/test';
import { KycFlowHelper } from './KycFlowHelper';
// import { AdminApi } from './AdminApi'; // cleanup გამორთულია — ნომრების pool გამოიყენება

/**
 * KYC fixture — `flow` (KycFlowHelper).
 * setup/teardown აქ ხდება, ამიტომ სპეკ-ფაილებში hooks აღარ საჭიროა.
 *
 *   import { test, expect } from '../../utils/kycFixture';
 *   test('...', async ({ flow }) => { await flow.completeOnboarding(); });
 *
 * ℹ️ ნომრებს აღარ ვშლით — nextPhone() pool-იდან ყოველ run-ზე ახალ (whitelisted) ნომერს იღებს.
 *    delete-cleanup კოდი დაკომენტარებულია — მოგვიანებით გამოსაყენებლად.
 */
type KycFixtures = { flow: KycFlowHelper };

export const test = base.extend<KycFixtures>({
  flow: async ({ page }, use) => {
    // --- pre-clean (გამორთული — pool-ს ვიყენებთ, არ ვშლით) ---
    // const admin = new AdminApi(request);
    // const pre = await admin.deleteMerchantByPhone(PHONE);
    // if (pre) console.log('🧹 pre-clean: removed leftover', PHONE);

    const flow = new KycFlowHelper(page);
    await use(flow);

    // HOLD=1 → ბრაუზერი ღიად რჩება (Inspector); სხვა შემთხვევაში 5წმ
    if (process.env.HOLD) {
      await page.pause();
    } else {
      await page.waitForTimeout(5000);
    }

    // --- post-clean (გამორთული — pool-ს ვიყენებთ, არ ვშლით) ---
    // if (flow.userId) {
    //   const ok = await admin.deleteMerchantByUserId(flow.userId, { retries: 10, delayMs: 3000 });
    //   console.log(ok ? `🧹 cleanup: deleted userId ${flow.userId}` : `⚠️ cleanup failed for ${flow.userId}`);
    // }
  },
});

export { expect } from '@playwright/test';