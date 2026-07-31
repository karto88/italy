import { test as base } from '@playwright/test';
import { KycFlowHelper } from './KycFlowHelper';
import { AdminApi } from './AdminApi';
import { TEST_DATA } from '../config/portal.config';

/**
 * KYC fixture — `flow` (KycFlowHelper) + ავტომატური cleanup.
 * setup/teardown აქ ხდება, ამიტომ სპეკ-ფაილებში hooks აღარ საჭიროა.
 *
 *   import { test, expect } from '../../utils/kycFixture';
 *   test('...', async ({ flow }) => { await flow.completeOnboarding(); });
 *
 * cleanup უსაფრთხოა — მხოლოდ ჩვენს ტესტ-იუზერს შლის (ნომერი+სახელი / userId).
 */
const PHONE = process.env.REG_PHONE || TEST_DATA.phone;

type KycFixtures = { flow: KycFlowHelper };

export const test = base.extend<KycFixtures>({
  flow: async ({ page, request }, use) => {
    const admin = new AdminApi(request);

    // pre-clean — ნარჩენი (ნომრით; ჩვენი ტესტ-ნომერი — მხოლოდ ჩვენი იუზერი აქ რეგისტრირდება)
    const pre = await admin.deleteMerchantByPhone(PHONE);
    if (pre) console.log('🧹 pre-clean: removed leftover', PHONE);

    const flow = new KycFlowHelper(page);
    await use(flow);

    // ბოლოს 5 წამი ბრაუზერი ღიად დარჩეს, მერე დაიხურება
    await page.waitForTimeout(5000);

    // post-clean — შექმნილი იუზერი userId-ით
    if (flow.userId) {
      const ok = await admin.deleteMerchantByUserId(flow.userId, { retries: 10, delayMs: 3000 });
      console.log(ok ? `🧹 cleanup: deleted userId ${flow.userId}` : `⚠️ cleanup failed for ${flow.userId}`);
    }
  },
});

export { expect } from '@playwright/test';