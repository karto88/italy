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
    residencePermitFile?: string; // Cittadinanza ≠ Italia → permesso di soggiorno (PDF)
  }, pep: {
    relationship: string;
    isPep?: boolean;
    tipoIncarico?: string;
    nazione?: string;
    status?: string;
  } = { relationship: 'No' }) {
    // 1-2. სქესი (Sesso)
    await this.selectFromCombo('Sesso', data.gender);

    // 3. დაბადების თარიღი (dev ID)
    const dob = this.page.locator('input[id="1.birth.date"]');
    await dob.click();
    await dob.pressSequentially(data.birthDate, { delay: 50 });

    // 4. მოქალაქეობა/ნაციონალობა დაბადებისას (Nazionalità)
    await this.selectFromCombo('Nazionalità', data.nationality);

    // 5-6. დაბადების ადგილი — Italia → Provincia/Comune dropdowns;
    //      უცხო Nazionalità → "Provincia di nascita" ქრება, "Comune di nascita" = ტექსტ-ველი
    if (data.nationality === 'Italia') {
      await this.selectFromCombo('Provincia di nascita', data.provinceOfBirth);
      await this.selectFromCombo('Comune di nascita', data.municipalityOfBirth);
    } else {
      await this.page.waitForTimeout(600); // ველების გადარენდერება
      await this.page.locator('input[name="1.birth.cityNameText"]').fill(data.municipalityOfBirth);
    }

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

    // 15. მოქალაქეობა (Cittadinanza)
    await this.selectFromCombo('Cittadinanza', data.citizenship);

    // 15a. Cittadinanza ≠ Italia → permesso di soggiorno (PDF) ატვირთვა
    if (data.citizenship !== 'Italia' && data.residencePermitFile) {
      const fc = this.page.waitForEvent('filechooser');
      await this.page.getByRole('button', { name: 'Carica documenti' }).click();
      await (await fc).setFiles(data.residencePermitFile);
    }

    // 16. საგადასახადო ქვეყანა (AML)
    await this.selectFromCombo('Paese fiscale AML', data.fiscalCountryAML);

    // 17. PEP ბლოკი (Rapporti con PEP + declared-ის შემთხვევაში დამატებითი ველები)
    await this.setPep(pep);
  }

  /**
   * PEP ბლოკი — "Rapporti con PEP" არჩევა + declared (≠ No)-ზე დამატებითი ველები.
   */
  private async setPep(pep: {
    relationship: string;
    isPep?: boolean;
    tipoIncarico?: string;
    nazione?: string;
    status?: string;
  }) {
    await this.page.getByRole('radio', { name: pep.relationship, exact: true }).check();

    if (pep.isPep) {
      await this.page
        .getByRole('checkbox', { name: /Sei una Persona Politicamente Esposta/i })
        .check();
    }

    // declared (≠ No) + isPep → Tipo di incarico (პოზიცია) + Nazione + Status incarico
    if (pep.relationship !== 'No') {
      if (pep.tipoIncarico) {
        const tipo = this.page.locator('label').filter({ hasText: pep.tipoIncarico });
        await tipo.scrollIntoViewIfNeeded();
        await tipo.click();
      }
      if (pep.nazione) await this.selectFromCombo('Nazione incarico', pep.nazione);
      if (pep.status) await this.selectFromCombo('Status incarico', pep.status);
    }
  }

  /** 18. Avanti (გაგრძელება) */
  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }
}