import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { OtpPage } from '../../pages/OtpPage';
import { MailinatorHelper } from '../../utils/MailinatorHelper';

/**
 * Login — არსებული KYB იუზერი (Adriatica 295394 SRL), dev.portal.keepz.it
 * ტელეფონი → პაროლი → OTP (Resend via email → mailinator) → /dashboard
 * credentials: .env KYB_MOBILE / KYB_PASSWORD / KYB_MAILINATOR_INBOX
 */
test('Login', async ({ page }) => {
  const login = new LoginPage(page);
  const otp = new OtpPage(page);

  await login.open();
  await login.loginWithPassword(process.env.KYB_MOBILE!, process.env.KYB_PASSWORD!);

  await otp.waitForScreen();
  const afterMs = Date.now() - 5000;
  await otp.resendViaEmail();
  const code = await new MailinatorHelper(process.env.KYB_MAILINATOR_INBOX!).getVerificationCode(120, afterMs);
  await otp.enterCode(code);

  await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
