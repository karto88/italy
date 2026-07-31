import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { PORTAL } from '../config/portal.config';

/**
 * LoginPage — ლოგინი / რეგისტრაცია
 * პორტალი: https://dev.portal.keepz.it/login
 *
 * ⚠️ Selector-ები placeholder-ია. დაზუსტდეს რეალურ გვერდზე
 *    `npm run codegen`-ით ან DevTools-ით.
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- Locators (codegen-ით დადასტურებული) ---
  private get phoneInput() {
    return this.page.getByRole('spinbutton', { name: 'Phone number' });
  }
  private get loginButton() {
    return this.page.getByRole('button', { name: 'Log in' });
  }
  private get registerLink() {
    return this.page.getByRole('link', { name: /register|sign ?up|რეგისტრაცია|registrati/i });
  }

  /** გახსნა login გვერდის */
  async open() {
    await this.goto(PORTAL.ROUTES.LOGIN);
  }

  /** ტელეფონის ნომრით login-ის ინიცირება (OTP-მდე) */
  async login(phone: string) {
    await this.phoneInput.click();
    await this.phoneInput.fill(phone);

    // ღილაკი აქტიურდება ვალიდური ნომრის შემდეგ — დაველოდოთ enabled-ს
    await this.loginButton.waitFor({ state: 'visible' });
    await expect(this.loginButton).toBeEnabled();
    await this.loginButton.click();

    // ხანდახან ერთი click არ კმარა — თუ ისევ login გვერდზეა, კიდევ დააჭირე
    try {
      await this.page.waitForURL(/otp/i, { timeout: 5000 });
    } catch {
      if (await this.loginButton.isEnabled().catch(() => false)) {
        await this.loginButton.click();
      }
      await this.page.waitForURL(/otp/i, { timeout: 15000 });
    }
  }

  /** გადასვლა რეგისტრაციაზე */
  async goToRegister() {
    await this.registerLink.click();
  }
}
