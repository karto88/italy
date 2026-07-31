import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * KycPersonalDataPage — KYC ვერიფიკაციის პირველი გვერდი (პირადი მონაცემები).
 * Italian form: სქესი, დაბადება, მოქალაქეობა, Codice Fiscale, საცხოვრებელი მისამართი.
 *
 * ⚠️ Codice Fiscale-ის "Generate" მუშაობს მხოლოდ მას შემდეგ, რაც შევსებულია:
 *    Sesso, Data di nascita, Nazionalità, Provincia/Comune di nascita.
 * ⚠️ CAP validation: min 4, max 10 სიმბოლო.
 * იხ. docs/kyc-verification-notes.md
 */
export class KycPersonalDataPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- helpers ---
  /** MUI dropdown — combobox გახსნა + option არჩევა */
  private async selectFromCombo(comboName: string, optionName: string) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  private textbox(name: string) {
    return this.page.getByRole('textbox', { name });
  }

  /**
   * პირველი გვერდის სრული შევსება.
   */
  async fillPage(data: {
    gender: string;
    birthDate: string;
    nationality: string;
    provinceOfBirth: string;
    municipalityOfBirth: string;
    countryOfResidence: string;
    provinceOfResidence: string;
    municipalityOfResidence: string;
    street: string;
    streetNumber: string;
    cap: string;
    citizenship: string;
    fiscalCountryAML: string;
  }) {
    // 1-2. სქესი (Sesso)
    await this.selectFromCombo('Sesso', data.gender);

    // 3. დაბადების თარიღი (masked textbox — ციფრები)
    const dob = this.textbox('Data di nascita');
    await dob.click();
    await dob.pressSequentially(data.birthDate, { delay: 50 });

    // 4. მოქალაქეობა/ნაციონალობა დაბადებისას (Nazionalità)
    await this.selectFromCombo('Nazionalità', data.nationality);

    // 5-6. დაბადების პროვინცია/კომუნა
    await this.selectFromCombo('Provincia di nascita', data.provinceOfBirth);
    await this.selectFromCombo('Comune di nascita', data.municipalityOfBirth);

    // 7. Codice Fiscale გენერაცია (ზემოთა ველების შემდეგ)
    await this.page.getByRole('button', { name: 'Generate' }).click();

    // 8-10. საცხოვრებელი: ქვეყანა/პროვინცია/კომუნა
    await this.selectFromCombo('Paese di residenza', data.countryOfResidence);
    await this.selectFromCombo('Provincia di residenza', data.provinceOfResidence);
    await this.selectFromCombo('Comune di residenza', data.municipalityOfResidence);

    // 11. ქუჩა
    await this.textbox('Via di residenza').fill(data.street);
    // 12. ქუჩის ნომერი (ცალკე ველი — obbligatorio)
    await this.textbox('Numero civico di residenza').fill(data.streetNumber);

    // 13. საფოსტო კოდი (CAP)
    await this.textbox('CAP di residenza').fill(data.cap);

    // 14. domicile == residence checkbox
    await this.page
      .locator('label')
      .filter({ hasText: 'Il domicilio corrisponde alla' })
      .getByRole('checkbox')
      .check();

    // 15-16. მოქალაქეობა + საგადასახადო ქვეყანა (AML)
    await this.selectFromCombo('Cittadinanza', data.citizenship);
    await this.selectFromCombo('Paese fiscale AML', data.fiscalCountryAML);

    // 17. radio "No"
    await this.page.getByRole('radio', { name: 'No' }).check();
  }

  /** 18. Avanti (გაგრძელება) */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}