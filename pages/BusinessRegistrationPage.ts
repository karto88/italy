import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * BusinessRegistrationPage — Business (Tppay Business (KYB)) რეგისტრაცია.
 * Business არჩევის შემდეგ: Continue → კომპანიის/signer-ის ფორმა + 2 თანხმობა.
 */
export class BusinessRegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- Locators ---
  private get continueButton() {
    return this.page.getByRole('button', { name: /^Continue$/i });
  }
  private get companyName() {
    return this.page.getByRole('textbox', { name: 'Company name' });
  }
  private get signerName() {
    return this.page.getByRole('textbox', { name: "Signer's name" });
  }
  private get signerSurname() {
    return this.page.getByRole('textbox', { name: "Signer's surname" });
  }
  private get companyTaxCode() {
    return this.page.getByRole('textbox', { name: 'Company tax code' });
  }
  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }
  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password', exact: true });
  }
  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: 'Confirm password' });
  }
  private get termsCheckbox() {
    return this.page.locator('label').filter({ hasText: 'I accept the Terms and' }).getByRole('checkbox');
  }
  private get privacyCheckbox() {
    return this.page.locator('label').filter({ hasText: 'I have read and understood' }).getByRole('checkbox');
  }

  private get verifyButton() {
    return this.page.getByRole('button', { name: 'Verify' });
  }

  /** Continue (Business არჩევის შემდეგ / OTP-ის შემდეგ) */
  async clickContinue() {
    await this.continueButton.waitFor({ state: 'visible' });
    await this.continueButton.click();
  }

  /** Verify — email OTP-ის გაგზავნა */
  async clickVerify() {
    await this.verifyButton.click();
  }

  /** OTP წარმატების მოდალის დახურვა ("Verification was successful" → OK) */
  async confirmOtpSuccess() {
    const ok = this.page.getByRole('button', { name: 'OK' });
    await ok.waitFor({ state: 'visible' });
    await ok.click();
  }

  /** კომპანიის/signer-ის ფორმის შევსება */
  async fillRegistration(data: {
    companyName: string;
    signerName: string;
    signerSurname: string;
    companyTaxCode: string;
    email: string;
    password: string;
  }) {
    await this.companyName.fill(data.companyName);
    await this.signerSurname.fill(data.signerSurname);
    await this.signerName.fill(data.signerName);
    await this.companyTaxCode.fill(data.companyTaxCode);
    await this.emailInput.fill(data.email);
    // password — click + type (React onChange)
    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(data.password, { delay: 40 });
    await this.confirmPasswordInput.click();
    await this.confirmPasswordInput.pressSequentially(data.password, { delay: 40 });
  }

  /** ორივე თანხმობის checkbox */
  async acceptTerms() {
    await this.termsCheckbox.check();
    await this.privacyCheckbox.check();
  }
}