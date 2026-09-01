import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KycDocumentPage — KYC ვერიფიკაცია, დოკუმენტის გვერდი.
 * Document type, ნომერი, გაცემის/ვადის თარიღები, გაცემის ადგილი, ორგანო.
 *
 * Document types: Carta d'Identità (ID), Patente (driver's license), Passaporto.
 * Issuing authorities: MCTC, Italian Representation Abroad, Ministry, Police Headquarter.
 * იხ. docs/kyc-verification-notes.md (test-case-ებისთვის).
 */
export class KycDocumentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** MUI Select dev-ID-ით → option */
  private async selectByIdOption(id: string, optionName: string) {
    await this.page.locator(`[id="${id}"]`).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).first().click();
  }

  /** masked date input (dev-ID) — ციფრებით შევსება */
  private async fillDateById(id: string, digits: string) {
    const field = this.page.locator(`input[id="${id}"]`);
    await field.click();
    await field.pressSequentially(digits, { delay: 50 });
  }

  /**
   * დოკუმენტის გვერდის შევსება (dev ID-ები: 2.document.*).
   */
  async fillPage(data: {
    documentType: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    issuePlace: string;
    issuingAuthority: string;
  }) {
    await this.selectByIdOption('2.document.type', data.documentType);
    await this.page.locator('[id="2.document.number"]').fill(data.documentNumber);
    await this.fillDateById('2.document.releaseDate', data.issueDate);
    await this.fillDateById('2.document.expiryDate', data.expiryDate);
    await this.page.locator('[id="2.document.releaseCity"]').fill(data.issuePlace);
    await this.selectByIdOption('2.document.releaseInstitution', data.issuingAuthority);
  }

  /** Avanti (შემდეგ გვერდზე გადასვლა) */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}