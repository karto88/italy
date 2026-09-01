import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';
import { nextPhone } from '../utils/randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * მხოლოდ რეგისტრაცია — phone → OTP → account type არჩევის ეკრანამდე.
 * მერე ხელით აირჩევ Individual ან Business (pause).
 */
test('registration only — stop at account type choice', async ({ page }) => {
  const login = new LoginPage(page);
  const otp = new OtpPage(page);

  const phone = nextPhone(); // pool-იდან ახალი whitelisted ნომერი
  console.log('📱 Phone:', phone);

  await login.open();
  await login.login(phone);
  await otp.waitForScreen();
  await otp.enterCode(TEST_DATA.otp);

  // ⏸️ Individual / Business არჩევის ეკრანი — აირჩიე ხელით
  await page.pause();
});