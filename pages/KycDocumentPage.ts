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

  private async selectFromCombo(comboName: string, optionName: string) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  private textbox(name: string) {
    return this.page.getByRole('textbox', { name });
  }

  /** masked date textbox — ციფრებით შევსება */
  private async fillDate(name: string, digits: string) {
    const field = this.textbox(name);
    await field.click();
    await field.pressSequentially(digits, { delay: 50 });
  }

  /**
   * დოკუმენტის გვერდის შევსება.
   */
  async fillPage(data: {
    documentType: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    issuePlace: string;
    issuingAuthority: string;
  }) {
    // 1. დოკუმენტის ტიპი
    await this.selectFromCombo('Tipo di documento', data.documentType);

    // 2. ნომერი
    await this.textbox('Numero del documento').fill(data.documentNumber);

    // 3-4. გაცემის და ვადის თარიღები
    await this.fillDate('Data di rilascio del documento', data.issueDate);
    await this.fillDate('Data di scadenza del documento', data.expiryDate);

    // 5. გაცემის ადგილი
    await this.textbox('Luogo di rilascio').fill(data.issuePlace);

    // 6. გამცემი ორგანო
    await this.selectFromCombo('Autorità di rilascio', data.issuingAuthority);
  }

  /** Avanti (შემდეგ გვერდზე გადასვლა) */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}