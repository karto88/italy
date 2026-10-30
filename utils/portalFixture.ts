import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';
import { AccountStatementPage } from '../pages/AccountStatementPage';
import { MailinatorHelper } from './MailinatorHelper';
import { MerchantBalanceFlow } from './MerchantBalanceFlow';

/**
 * Portal fixture — KYB მერჩანტი (.env KYB_*) უკვე დალოგინებული dev.portal.keepz.it-ზე.
 * login ერთხელ ხდება worker-ზე (OTP: Resend via email → mailinator), session → storageState.
 *
 *   import { test } from '../../utils/portalFixture';
 *   test('...', async ({ balance }) => { await balance.businessToOperating('1.00'); });
 */
type PortalWorkerFixtures = { portalState: Awaited<ReturnType<import('@playwright/test').BrowserContext['storageState']>> };
type PortalFixtures = { statement: AccountStatementPage; mail: MailinatorHelper; balance: MerchantBalanceFlow };

export const test = base.extend<PortalFixtures, PortalWorkerFixtures>({
  portalState: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const login = new LoginPage(page);
      const otp = new OtpPage(page);

      await login.open();
      await login.loginWithPassword(process.env.KYB_MOBILE!, process.env.KYB_PASSWORD!);
      await otp.waitForScreen();
      const afterMs = Date.now() - 5000;
      await otp.resendViaEmail();
      await otp.enterCode(await new MailinatorHelper(process.env.KYB_MAILINATOR_INBOX!).getVerificationCode(120, afterMs));
      await page.waitForURL(/dashboard/, { timeout: 20000 });

      await use(await context.storageState());
      await context.close();
    },
    { scope: 'worker' },
  ],
  storageState: async ({ portalState }, use) => use(portalState),
  statement: async ({ page }, use) => use(new AccountStatementPage(page)),
  mail: async ({}, use) => use(new MailinatorHelper(process.env.KYB_MAILINATOR_INBOX!)),
  balance: async ({ statement, mail }, use) => use(new MerchantBalanceFlow(statement, mail)),
});

export { expect } from '@playwright/test';
