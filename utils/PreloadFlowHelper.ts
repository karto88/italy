import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';
import { KycPage } from '../pages/KycPage';
import { KycVerificationPage } from '../pages/KycVerificationPage';
import { KycPersonalDataPage } from '../pages/KycPersonalDataPage';
import { KycDocumentPage } from '../pages/KycDocumentPage';
import { KycFinancialPage } from '../pages/KycFinancialPage';
import { KycFlowHelper } from './KycFlowHelper';
import { MailinatorHelper } from './MailinatorHelper';
import { Individual, PartnerApi } from './PartnerApi';
import { nextKeepzitEmail, nextPreloadPhone } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * PreloadFlowHelper — KI-456 / KI-481: pre-loaded onboarding პორტალში, ბოლომდე.
 * partner prePopulateKyc → existence/wallet ლინკი → /register?ref= → OTP → შევსებული რეგისტრაცია →
 * Verifica Email → KYC (personal / document / AML) → Firma → liveness.
 * ყოველ გვერდზე: partner-ის გაგზავნილი ↔ ფორმაში დახვედრილი (expect.soft — flow ბოლომდე მიდის,
 * ყველა სხვაობა ბოლოს ერთად ჩანს).
 * STEP_DELAY=10000 → ნაბიჯებს შორის პაუზა (ხელით სანახავად).
 */
const DOC_LABEL = {
  IDENTITY_CARD: TEST_DATA.documentTypes.cartaIdentita,
  PASSPORT: TEST_DATA.documentTypes.passaporto,
  DRIVING_LICENSE: TEST_DATA.documentTypes.patente,
};

/** YYYY-MM-DD → DD-MM-YYYY (პორტალის ფორმატი) */
const uiDate = (iso: string) => iso.split('-').reverse().join('-');

export class PreloadFlowHelper {
  private login: LoginPage;
  private otp: OtpPage;
  private kyc: KycPage;
  private verification: KycVerificationPage;
  private personal: KycPersonalDataPage;
  private document: KycDocumentPage;
  private financial: KycFinancialPage;
  private kycFlow: KycFlowHelper;
  private delay = Number(process.env.STEP_DELAY || 0);

  constructor(private page: Page, private partner: PartnerApi) {
    this.login = new LoginPage(page);
    this.otp = new OtpPage(page);
    this.kyc = new KycPage(page);
    this.verification = new KycVerificationPage(page);
    this.personal = new KycPersonalDataPage(page);
    this.document = new KycDocumentPage(page);
    this.financial = new KycFinancialPage(page);
    this.kycFlow = new KycFlowHelper(page); // Firma + liveness (summary/status listeners — კონსტრუქტორში)
  }

  private async step(label: string) {
    console.log(`▶ ${label}`);
    if (this.delay) await this.page.waitForTimeout(this.delay);
  }

  /** ველის მნიშვნელობა name-ით ან id-ით */
  private async field(key: string): Promise<string> {
    const el = this.page.locator(`input[name="${key}"], input[id="${key}"], textarea[name="${key}"]`).first();
    await el.waitFor({ state: 'attached' });
    return el.inputValue();
  }

  /** გაგზავნილი ↔ დახვედრილი, soft — ცხრილად ლოგში */
  private async compare(page: string, rows: [string, string, string][]) {
    console.log(`  ── ${page}`);
    for (const [label, key, sent] of rows) {
      const shown = await this.field(key).catch(() => '<no field>');
      console.log(`  ${shown === sent ? '✅' : '❌'} ${label}: sent "${sent}" → shown "${shown}"`);
      expect.soft(shown, `${page} — ${label}`).toBe(sent);
    }
  }

  /**
   * 1-3. partner pre-load (pool ნომერი, keepzitNN მეილი) → /register?ref= → OTP → შევსებული რეგისტრაცია → ანგარიში
   * (partner-ის ლინკი root-ზეა და ref იკარგება — /register?ref= პირდაპირ)
   */
  async registerViaLink() {
    const person = this.partner.individual();
    person.mobile = nextPreloadPhone();
    person.email = nextKeepzitEmail();
    const body = await this.partner.prePopulateKyc([person]);
    expect(body.results[0].outcome).toBe('ACCEPTED');
    const ref = await this.partner.onboardingLink(person.fiscalCode);
    console.log(`👤 ${person.name} ${person.surname} | ${person.fiscalCode} | +39 ${person.mobile} | ${person.email}`);

    await this.page.goto(`/register?ref=${ref}`);
    await this.otp.waitForScreen();
    await expect(this.page.getByText(`+39 *** *** ${person.mobile.slice(-3)}`)).toBeVisible();
    await this.step('link opened → OTP screen');
    await this.otp.enterCode('111111');
    await this.step('OTP 111111');

    await this.compare('Registration', [
      ['Name', 'name', person.name],
      ['Surname', 'lastName', person.surname],
    ]);
    await this.page.getByRole('textbox', { name: /^Password/i }).pressSequentially(TEST_DATA.password, { delay: 50 });
    await this.page.getByRole('textbox', { name: /Confirm password/i }).pressSequentially(TEST_DATA.password, { delay: 50 });
    await this.kyc.acceptTerms();
    await this.step('password + consents');
    await this.kyc.clickContinue();
    await this.kyc.startKycProcess();
    await this.step('registered → Inizia il processo KYC');
    return { person, ref };
  }

  /** 4. Verifica Email — partner-ის მეილი (ცარიელია → ვწერთ) → mailinator OTP → TPPay თანხმობები */
  async verifyEmail(email: string) {
    const emailInput = this.page.getByRole('textbox', { name: 'Email *' });
    await emailInput.waitFor({ state: 'visible' });
    const shownEmail = await emailInput.inputValue();
    console.log(`  ${shownEmail === email ? '✅' : '❌'} Email: sent "${email}" → shown "${shownEmail}"`);
    expect.soft(shownEmail, 'Verifica Email — Email').toBe(email);
    if (!shownEmail) await this.verification.enterEmail(email);
    const sentAt = Date.now();
    await this.verification.sendEmailOtp();
    const code = await new MailinatorHelper(email).getVerificationCode(60, sentAt - 10000);
    await this.verification.enterEmailOtp(code);
    await this.step(`email OTP ${code}`);
    await this.verification.acceptTerms();
    await this.verification.clickContinua();
    await this.step('TPPay consents → KYC');
  }

  /** სრული flow ერთ იუზერზე: IDENTITY_CARD / MUNICIPALITY, ნომერი pool-იდან (OTP 111111), keepzitNN მეილი */
  async completePreloadedOnboarding() {
    const { person } = await this.registerViaLink();
    await this.verifyEmail(person.email);
    await this.fillKyc(person);
  }

  /**
   * არსებული კლიენტი (§1.1 alreadyRegistered, §1.6 attach): ჩვეულებრივი რეგისტრაცია (ლინკის გარეშე, pool ნომერი) →
   * ბრაუზერი დაიხურა (session აღარ არის) → partner-ის pre-load ამ ნომერზე → ლინკი:
   * "You already have a Keepz account" (OTP-ის გარეშე) → Log in → attach (200) →
   * Verifica Email → KYC შევსებულია partner-ის მონაცემებით → liveness
   */
  async existingCustomerOnboarding() {
    const mobile = nextPreloadPhone();
    await this.kycFlow.registerIndividual(mobile);
    const kycUrl = this.page.url(); // Verifica Email
    await this.step(`registered without link — +39 ${mobile}`);

    await this.page.context().clearCookies();
    await this.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await this.page.goto('about:blank');
    await this.step('browser closed (session gone)');

    const { person, ref } = await this.partner.preloadForExistingCustomer(mobile, nextKeepzitEmail());
    console.log(`👤 partner: ${person.name} ${person.surname} | ${person.fiscalCode} | +39 ${mobile} | ${person.email}`);
    await this.step('partner pre-load on the same mobile');

    await this.page.goto(`/register?ref=${ref}`);
    await expect(this.page.getByText('You already have a Keepz account. Log in to continue.')).toBeVisible();
    await expect(this.page.getByText(/We sent a code/i), 'no OTP for an existing account').toBeHidden();
    await this.step('link → "You already have a Keepz account"');
    await this.page.getByRole('button', { name: 'Log in' }).click();

    const attach = this.page.waitForResponse((r) => r.url().includes('/preloaded/attach') && r.request().method() === 'POST');
    await this.login.loginWithPassword(mobile, TEST_DATA.password);
    await this.otp.enterCode('111111');
    const res = await attach;
    const body = await res.text();
    console.log(`  attach (portal) → ${res.status()} ${body}`);
    expect(res.status(), `attach: ${body}`).toBe(200);
    await this.step('logged in → attach 200');

    await this.page.goto(kycUrl);
    await this.kyc.startKycProcess(); // "Ci siamo quasi" → Inizia il processo KYC
    await this.verifyEmail(person.email);
    await this.fillKyc(person);
  }

  /** verification დაწყებულია: ref-ით რეგისტრაცია → Verifica Email → KYC გვერდი 1 შენახული → ახალი pre-load → attach 409 / 3215 */
  async attachAfterVerificationStarted() {
    const { person } = await this.registerViaLink();
    await this.verifyEmail(person.email);
    await this.fillKyc(person, 'personal');
    await this.partner.attachAfterVerificationStarted(person.mobile, person.email);
  }

  /**
   * 5-8. KYC: პირადი (შედარება + Residenza Fiscale/PEP) → დოკუმენტი (შედარება) → AML → Firma → liveness.
   * `upTo: 'personal'` → ჩერდება პირველი გვერდის შენახვაზე (verification დაწყებულია — attach 3215)
   */
  async fillKyc(person: Individual, upTo: 'personal' | 'liveness' = 'liveness') {
    const doc = person.documents[0];
    const addr = person.addresses[0];

    // 5. KYC გვერდი 1 — პირადი მონაცემები
    await this.page.locator('input[name="1.name"]').waitFor();
    await this.compare('KYC personal data', [
      ['Nome', '1.name', person.name],
      ['Cognome', '1.surname', person.surname],
      ['Sesso', '1.gender', person.gender],
      ['Data di nascita', '1.birth.date', uiDate(person.birth.date)],
      ['Nazionalità', '1.birth.countryName', 'Italia'],
      ['Provincia di nascita', '1.birth.provName', 'Roma'],
      ['Comune di nascita', '1.birth.cityName', person.birth.cityName],
      ['Codice Fiscale', '1.taxCode', person.fiscalCode],
      ['Paese di residenza', '1.countryOfResidence', 'Italia'],
      ['Provincia di residenza', '1.provinceOfResidence', 'Roma'],
      ['Comune di residenza', '1.cityOfResidence', addr.cityName],
      ['Indirizzo', '1.streetOfResidence', addr.street],
      ['Numero civico', '1.houseNumberOfResidence', addr.number],
      ['CAP', '1.zipcodeOfResidence', addr.zipCode],
      ['Cittadinanza', '1.citizenship', person.citizenship.name],
    ]);
    await this.personal.fillMissingAfterPreload(TEST_DATA.kycPersonal.fiscalCountryAML, TEST_DATA.pep.none);
    await this.step('Residenza Fiscale + PEP: No');
    await this.personal.clickAvanti();
    if (upTo === 'personal') {
      await this.page.locator('[id="2.document.number"]').waitFor();
      console.log('✅ KYC page 1 saved — verification started');
      return;
    }

    // 6. KYC გვერდი 2 — დოკუმენტი
    await this.page.locator('[id="2.document.number"]').waitFor();
    await this.step('document page');
    await this.compare('KYC document', [
      ['Tipo documento', '2.document.type', DOC_LABEL[doc.type]],
      ['Numero', '2.document.number', doc.number],
      ['Data di rilascio', '2.document.releaseDate', uiDate(doc.releaseDate)],
      ['Data di scadenza', '2.document.expiryDate', uiDate(doc.expiryDate)],
      ['Luogo di rilascio', '2.document.releaseCity', doc.releaseCity],
      ['Ente di rilascio', '2.document.releaseInstitution', TEST_DATA.enteRilascio.cartaIdentita],
    ]);
    await this.document.clickAvanti();
    // ცარიელი/არასწორი ველი → ვალიდაცია აჩერებს: ვავსებთ partner-ის მონაცემებით და ვაგრძელებთ
    const stuck = await this.page
      .locator('[id="2.document.number"]')
      .waitFor({ state: 'hidden', timeout: 10000 })
      .then(() => false)
      .catch(() => true);
    if (stuck) {
      console.log('  ⚠️ document page did not pass with pre-filled values — filling from partner data');
      await this.document.fillPage({
        documentType: DOC_LABEL[doc.type],
        documentNumber: doc.number,
        issueDate: uiDate(doc.releaseDate).replace(/-/g, ''),
        expiryDate: uiDate(doc.expiryDate).replace(/-/g, ''),
        issuePlace: doc.releaseCity,
        issuingAuthority: TEST_DATA.enteRilascio.cartaIdentita,
      });
      await this.document.clickAvanti();
    }

    // 7. AML კითხვარი (partner არ აგზავნის)
    await this.step('AML questionnaire');
    await this.financial.fillPage(TEST_DATA.kycFinancial);
    await this.financial.clickAvanti();
    await this.step('AML done → Firma');

    // 8. Firma → liveness (LIVENESS_PENDING)
    await this.kycFlow.signKyc();
    await this.step('signed → liveness');
    console.log(`🏆 pre-loaded onboarding complete — ${person.name} ${person.surname} (${person.fiscalCode})`);
  }
}
