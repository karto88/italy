import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AccountTypePage — account type-ის არჩევა OTP-ის შემდეგ
 * Individual → KYC (ფიზიკური პირი)
 * Business   → KYB (იურიდიული პირი)
 */
export class AccountTypePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get individualButton() {
    return this.page.getByRole('button', { name: /^Individual/i });
  }

  private get businessButton() {
    return this.page.getByRole('button', { name: /^Business/i });
  }

  /** Individual (KYC) არჩევა */
  async chooseIndividual() {
    await this.individualButton.waitFor({ state: 'visible' });
    await this.individualButton.click();
  }

  /** Business (KYB) არჩევა */
  async chooseBusiness() {
    await this.businessButton.waitFor({ state: 'visible' });
    await this.businessButton.click();
  }
}