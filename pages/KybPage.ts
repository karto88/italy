import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PORTAL } from '../config/portal.config';

/**
 * KybPage — Know Your Business (იურიდიული პირის ვერიფიკაცია)
 *
 * ⚠️ Selector-ები და ნაბიჯები placeholder-ია.
 *    დაზუსტდეს რეალურ KYB flow-ზე გავლის შემდეგ.
 */
export class KybPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto(PORTAL.ROUTES.KYB);
  }

  /**
   * კომპანიის მონაცემების შევსება
   * TODO: რეალური ველების მიხედვით დაზუსტება
   */
  async fillCompanyInfo(data: {
    companyName: string;
    vatNumber?: string; // Partita IVA (Italy)
    registrationNumber?: string;
  }) {
    await this.page.getByLabel(/company ?name|ragione sociale/i).fill(data.companyName);
    if (data.vatNumber) {
      await this.page.getByLabel(/vat|partita iva/i).fill(data.vatNumber);
    }
    if (data.registrationNumber) {
      await this.page.getByLabel(/registration|numero di registrazione/i).fill(data.registrationNumber);
    }
  }

  /** კომპანიის დოკუმენტის ატვირთვა */
  async uploadDocument(filePath: string) {
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  /** გაგზავნა / submit */
  async submit() {
    await this.page.getByRole('button', { name: /submit|continue|invia|continua/i }).click();
  }
}
