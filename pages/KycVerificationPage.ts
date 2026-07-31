import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KycVerificationPage — KYC ვერიფიკაცია (Italian provider screen).
 * Flow: Inizia il processo KYC → Email → Invia OTP email → Email OTP →
 *       3 თანხმობა → Continua.
 */
export class KycVerificationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- Locators ---
  private get startButton() {
    return this.page.getByRole('button', { name: 'Inizia il processo KYC' });
  }
  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email *' });
  }
  private get sendOtpButton() {
    return this.page.getByRole('button', { name: 'Invia OTP email' });
  }
  private get emailOtpInput() {
    return this.page.getByRole('spinbutton', { name: 'Email OTP *' });
  }
  private get continuaButton() {
    return this.page.getByRole('button', { name: 'Continua' });
  }

  private checkbox(text: string) {
    return this.page.locator('label').filter({ hasText: text }).getByRole('checkbox');
  }

  /** "Inizia il processo KYC" — ვერიფიკაციის დაწყება */
  async start() {
    await this.startButton.waitFor({ state: 'visible' });
    await this.startButton.click();
  }

  /** იმეილის შეყვანა */
  async enterEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
  }

  /** "Invia OTP email" — OTP-ის გაგზავნა იმეილზე */
  async sendEmailOtp() {
    await this.sendOtpButton.click();
  }

  /** მეილზე მოსული OTP-ის შეყვანა */
  async enterEmailOtp(code: string) {
    await this.emailOtpInput.click();
    await this.emailOtpInput.pressSequentially(code, { delay: 50 });
  }

  /** სამივე თანხმობის checkbox მონიშვნა */
  async acceptTerms() {
    await this.checkbox('Ho preso visione dell’').check();
    await this.checkbox('Ho preso visione del Foglio').check();
    await this.checkbox('Accetto Termini e Condizioni').check();
  }

  /** "Continua" */
  async clickContinua() {
    await this.continuaButton.click();
  }
}