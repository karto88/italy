import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * NuveiKybPage — Nuvei (POS) არჩევა + KYB Onboarding Wizard (Organization step).
 * Digital POS → Continue → Verify → Start KYB → კომპანიის ინფო → Avanti.
 */
export class NuveiKybPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- POS არჩევა / დაწყება ---
  async chooseDigitalPos() {
    await this.page.getByRole('button', { name: /Digital POS/i }).click();
  }
  async clickContinue() {
    await this.page.getByRole('button', { name: /^Continue$/i }).click();
  }
  /** Verify — ხანდახან ცალკე ბიჯია, ხანდახან არა (KI-225-ის მსგავსად). თუ არ ჩანს, გამოტოვე. */
  async clickVerify() {
    const btn = this.page.getByRole('button', { name: /^Verify$/i });
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
    }
  }
  async clickStartKyb() {
    await this.page.getByRole('button', { name: 'Start KYB process' }).click();
  }

  // --- helpers ---
  private async selectFromCombo(comboName: string, optionName: string) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  /** MUI Autocomplete dev-ID-ით (Paese/country) — click → type → option */
  private async selectAutocompleteById(id: string, value: string) {
    const el = this.page.locator(`[id="${id}"]`);
    await el.click();
    await el.fill(value);
    await this.page.getByRole('option', { name: value, exact: true }).first().click();
  }

  /** MUI Select dev-ID-ით (Nazionalità / Tipo di UBO) — click → option */
  private async selectByIdOption(id: string, value: string) {
    await this.page.locator(`[id="${id}"]`).click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  private textbox(name: string) {
    return this.page.getByRole('textbox', { name });
  }

  /**
   * Organization step — კომპანიის ინფო.
   */
  async fillOrganization(data: {
    companyType: string; // Private Company | Public Company | Non Profit
    registrationNumber: string;
    street: string;
    city: string;
    houseNumber: string;
    cap: string;
    country: string;
  }) {
    await this.selectFromCombo('Tipo di società', data.companyType);
    await this.textbox('Numero di registrazione').fill(data.registrationNumber);
    await this.textbox('Via').fill(data.street);
    await this.textbox('Città').fill(data.city);
    // dev ID-ები (Numero / CAP / Paese)
    await this.page.locator('[id="1.address.houseNumber"]').fill(data.houseNumber);
    await this.page.locator('[id="1.address.zipcode"]').fill(data.cap);
    await this.selectAutocompleteById('1.address.countryName', data.country);
  }

  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }

  /** ბოლოს — Close (merchant portal-ზე დაბრუნება) */
  async clickClose() {
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  /**
   * Ubos step — beneficial owner-ის მონაცემები.
   * ⚠️ Paese/Nazionalità — შემდეგ ქეისებში არა-იტალიური გასათვალისწინებელი.
   */
  async fillUbo(data: {
    firstName: string;
    lastName: string;
    nationality: string;
    birthDate: string; // ddmmyyyy
    country: string;
    uboType: string; // CEO | ...
  }) {
    await this.page.locator('[id="2.members.0.name"]').fill(data.firstName);
    await this.page.locator('[id="2.members.0.surname"]').fill(data.lastName);
    await this.selectByIdOption('2.members.0.nationality', data.nationality);

    const dob = this.page.locator('input[id="2.members.0.dateOfBirth"]').first();
    await dob.click();
    await dob.pressSequentially(data.birthDate, { delay: 50 });

    await this.selectAutocompleteById('2.members.0.countryName', data.country);

    // 🔎 DISCOVERY: Tipo di UBO options-ის ამოღება (სრული სიისთვის)
    if (process.env.HOLD_UBO) {
      await this.page.locator('[id="2.members.0.type"]').click();
      await this.page.waitForTimeout(500);
      const opts = await this.page.getByRole('option').allInnerTexts();
      console.log('UBO_TYPES_START' + JSON.stringify(opts) + 'UBO_TYPES_END');
      await this.page.pause(); // ბრაუზერი ღია — dropdown გახსნილი
    }

    await this.selectByIdOption('2.members.0.type', data.uboType);
  }

  /**
   * UBO — Tipo di documento checkbox (dev ID: 2.members.0.documentType-{docType}) + ატვირთვა.
   * allowed: png, jpeg, pdf.
   */
  async selectDocTypeAndUpload(docType: string, filePath: string) {
    await this.page.locator(`[id="2.members.0.documentType-${docType}"]`).click();
    // დოკუმენტის ატვირთვა — file input member-row-ში (row ნომერი დინამიური → partial)
    await this.page
      .locator('[id^="member-row-"] input[type="file"], input[id^="member-row-"]')
      .first()
      .setInputFiles(filePath);
    await this.page.waitForTimeout(4000); // async upload
  }

  /** Verification step — company doc (dev ID: document-row-N; row დინამიური → partial) */
  async uploadVerificationDoc(filePath: string) {
    await this.page
      .locator('[id^="document-row-"] input[type="file"], input[id^="document-row-"]')
      .first()
      .setInputFiles(filePath);
    await this.page.waitForTimeout(4000);
  }

  /**
   * Bank account step (ბოლო) — statement ატვირთვა (dev ID: statement-row-N) +
   * countryName / accountNumber (IBAN) / displayName.
   */
  async fillBankAccount(data: {
    statementFile: string;
    country: string;
    accountNumber: string;
    displayName: string;
  }) {
    await this.page
      .locator('[id^="statement-row-"] input[type="file"], input[id^="statement-row-"]')
      .first()
      .setInputFiles(data.statementFile);
    await this.page.waitForTimeout(3000);
    await this.selectAutocompleteById('4.bankAccountData.countryName', data.country);
    await this.page.locator('[id="4.bankAccountData.accountNumber"]').fill(data.accountNumber);
    await this.page.locator('[id="4.bankAccountData.displayName"]').fill(data.displayName);
  }
}