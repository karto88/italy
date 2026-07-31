import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KycPage — Know Your Customer (ფიზიკური პირის რეგისტრაცია/ვერიფიკაცია)
 * Individual flow — ბიჯები თანდათან ივსება რეალურ flow-ზე გავლისას.
 */
export class KycPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- Locators ---
  private get nameInput() {
    return this.page.getByRole('textbox', { name: 'Name', exact: true });
  }
  private get surnameInput() {
    return this.page.getByRole('textbox', { name: 'Surname' });
  }
  private get passwordInput() {
    // რეალური accessible name: 'Password *' (ვარსკვლავით) — regex ანაზღაურებს
    return this.page.getByRole('textbox', { name: /^Password/i });
  }
  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: /Confirm password/i });
  }
  private get termsCheckbox() {
    return this.page
      .locator('label')
      .filter({ hasText: 'I accept the Terms and' })
      .getByRole('checkbox');
  }
  private get privacyCheckbox() {
    return this.page
      .locator('label')
      .filter({ hasText: 'I have read and understood' })
      .getByRole('checkbox');
  }
  private get continueButton() {
    return this.page.getByRole('button', { name: /^Continue$/i });
  }
  private get verifyButton() {
    return this.page.getByRole('button', { name: /^Verify$/i });
  }
  private get startKycButton() {
    return this.page.getByRole('button', { name: 'Inizia il processo KYC' });
  }

  /** რეგისტრაციის ფორმის შევსება */
  async fillRegistration(data: {
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword?: string;
  }) {
    await this.nameInput.fill(data.firstName);
    await this.surnameInput.fill(data.lastName);
    // password/confirm — click + type (React onChange-ის გასააქტიურებლად)
    await this.typeInto(this.passwordInput, data.password);
    await this.typeInto(this.confirmPasswordInput, data.confirmPassword ?? data.password);
  }

  /** helper: ველის გასუფთავება და ცოცხალი ტიპინგი */
  private async typeInto(locator: ReturnType<Page['getByRole']>, value: string) {
    await locator.click();
    await locator.fill('');
    await locator.pressSequentially(value, { delay: 50 });
  }

  /** ორივე თანხმობის checkbox მონიშვნა (idempotent — check) */
  async acceptTerms() {
    await this.termsCheckbox.check();
    await this.privacyCheckbox.check();
  }

  /** Continue ღილაკზე დაჭერა (მრავალ ბიჯზე გამოსაყენებელი) */
  async clickContinue() {
    await this.continueButton.waitFor({ state: 'visible' });
    await this.continueButton.click();
  }

  /** Verify ღილაკი — KYC ვერიფიკაციის დაწყება */
  async clickVerify() {
    await this.verifyButton.waitFor({ state: 'visible' });
    await this.verifyButton.click();
  }

  /** "Inizia il processo KYC" — KYC პროცესის დაწყება (post-Verify) */
  async startKycProcess() {
    await this.startKycButton.waitFor({ state: 'visible' });
    await this.startKycButton.click();
  }
}