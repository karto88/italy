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

  /**
   * ყველა (4) თანხმობის checkbox მონიშვნა.
   * checkbox-ები disabled-ია — თითოეულს თავისი "Open document" ღილაკი აქვს, რომელიც
   * ორი ტიპის მოდალს ხსნის:
   *  - PDF viewer (3 დოკუმენტი) — "Scroll to the bottom to continue" → Confirm გააქტიურდება
   *    სქროლის ბოლომდე მისვლისას → Confirm-ზე დაჭერა ინიშნავს checkbox-ს.
   *  - "This document opens in a new tab" (ბოლო, FEA T&C) — "Open in new tab" ღილაკი
   *    ხსნის დოკუმენტს ახალ ტაბში და ავტომატურად ინიშნავს checkbox-ს.
   */
  async acceptTerms() {
    const openDocButtons = this.page.getByRole('button', { name: 'Open document' });
    await openDocButtons.first().waitFor({ state: 'visible' });
    const count = await openDocButtons.count();

    for (let i = 0; i < count; i++) {
      await openDocButtons.nth(i).click();

      const openInNewTabBtn = this.page.getByRole('button', { name: 'Open in new tab' });
      if (await openInNewTabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const newPagePromise = this.page.context().waitForEvent('page');
        await openInNewTabBtn.click();
        const newPage = await newPagePromise;
        await newPage.close();
        continue;
      }

      // PDF viewer მოდალი — JS-ით ვასქროლებთ ყველა scrollable ელემენტს ბოლომდე
      // (mouse.wheel კურსორის პოზიციაზეა დამოკიდებული და არასანდოა).
      const confirmBtn = this.page.getByRole('button', { name: 'Confirm', exact: true });
      for (let s = 0; s < 40 && !(await confirmBtn.isEnabled().catch(() => false)); s++) {
        await this.page.evaluate(() => {
          document.querySelectorAll('*').forEach((el) => {
            if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight;
          });
        });
        await this.page.waitForTimeout(250);
      }
      await confirmBtn.click({ timeout: 30000 });
    }
  }

  /** "Continua" */
  async clickContinua() {
    await this.continuaButton.click();
  }
}