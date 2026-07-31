import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KycFinancialPage — KYC ვერიფიკაცია, AML კითხვარი (Questionario Antiriciclaggio).
 * 3 checkbox-ჯგუფი (Scopo del rapporto / Origine del reddito / Origine del patrimonio)
 * + dropdown-ები (Professione svolta, Tipologia di contratto, Reddito Annuo,
 *   Patrimonio, Cariche societarie).
 */
export class KycFinancialPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private checkbox(name: string) {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  private async selectFromCombo(comboName: string, optionName: string | RegExp) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName }).first().click();
  }

  /**
   * AML კითხვარის შევსება.
   */
  async fillPage(data: {
    scopo: string;
    incomeOrigin: string;
    patrimonyOrigin: string;
    profession: string;
    contractType: string;
    annualIncome: string;
    patrimony: string;
    corporateRoles: string;
  }) {
    // checkbox-ები (თითო ჯგუფში ერთი)
    await this.checkbox(data.scopo).check();
    await this.checkbox(data.incomeOrigin).check();
    await this.checkbox(data.patrimonyOrigin).check();

    // Professione svolta (dropdown → partial option)
    await this.selectFromCombo('Professione svolta', new RegExp(data.profession, 'i'));

    // შემდეგი dropdown-ები
    await this.selectFromCombo('Tipologia di contratto', data.contractType);
    await this.selectFromCombo('Reddito Annuo', data.annualIncome);
    await this.selectFromCombo('Patrimonio', data.patrimony);
    await this.selectFromCombo('Cariche societarie in', data.corporateRoles);
  }

  /** Avanti */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}