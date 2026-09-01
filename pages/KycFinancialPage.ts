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

  /** MUI Select dev-ID-ით → option (partial/first) */
  private async selectByIdOption(id: string, optionName: string) {
    await this.page.locator(`[id="${id}"]`).click();
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
    // checkbox-ები უცვლელი (თითო ჯგუფში ერთი)
    await this.checkbox(data.scopo).check();
    await this.checkbox(data.incomeOrigin).check();
    await this.checkbox(data.patrimonyOrigin).check();

    // dropdown-ები — dev ID-ები (3.QP_*)
    await this.selectByIdOption('3.QP_JOB', data.profession); // Professione (partial)
    await this.selectByIdOption('3.QP_CONT', data.contractType); // Tipologia di contratto
    await this.selectByIdOption('3.QP_REVENUE', data.annualIncome); // Reddito Annuo
    await this.selectByIdOption('3.QP_ASSETS', data.patrimony); // Patrimonio
    await this.selectByIdOption('3.QP_PUBB', data.corporateRoles); // Cariche societarie
  }

  /** Avanti */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}