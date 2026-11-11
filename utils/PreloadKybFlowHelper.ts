import { Page, expect } from '@playwright/test';
import { OtpPage } from '../pages/OtpPage';
import { BusinessRegistrationPage } from '../pages/BusinessRegistrationPage';
import { WalletKybPage } from '../pages/WalletKybPage';
import { BusinessFlowHelper } from './BusinessFlowHelper';
import { MailinatorHelper } from './MailinatorHelper';
import { PartnerKybApi, Merchant } from './PartnerKybApi';
import { nextPreloadPhone } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * PreloadKybFlowHelper — pre-loaded onboarding პორტალში, merchant (KI-456, KYB).
 * partner prePopulateKyb → existence/wallet (კომპანიის CF, merchants[].fiscalCode) → /register?ref= → OTP (წარმომადგენლის ნომერი) →
 * შევსებული "Enter your business details" → email OTP (§1.4) → რეგისტრაცია → Yousign → KYB:
 * Azienda / Sede / Persone — partner-ის გაგზავნილი ↔ ფორმაში დახვედრილი (soft) → PEP → AML → Documenti → Firma → Video.
 * Persone-ზე partner-ს მისამართი/მოქალაქეობა არ აქვს (§7.9 members) — ვავსებთ.
 * ნელა სანახავად: STEP_DELAY=10000
 */
export class PreloadKybFlowHelper {
  private otp: OtpPage;
  private registration: BusinessRegistrationPage;
  private wallet: WalletKybPage;
  private business: BusinessFlowHelper;
  private delay = Number(process.env.STEP_DELAY || 0);

  constructor(private page: Page, private partner: PartnerKybApi) {
    this.otp = new OtpPage(page);
    this.registration = new BusinessRegistrationPage(page);
    this.wallet = new WalletKybPage(page);
    this.business = new BusinessFlowHelper(page); // Yousign + profile/details → tppayStatus
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

  /** YYYY-MM-DD → DD-MM-YYYY (KYB date ველები) */
  private dmy(date: string) {
    return date.split('-').reverse().join('-');
  }

  /** სრული flow: ახალი merchant → ლინკი → რეგისტრაცია → KYB შევსებული → liveness */
  async completePreloadedKybOnboarding() {
    const merchant = await this.registerViaLink();
    await this.signAgreementAndStartKyb();
    await this.checkAzienda(merchant);
    await this.checkSede(merchant);
    await this.checkPersone(merchant);
    await this.finishKyb(merchant);
  }

  /** 1-4. pre-load (pool ნომერი) → /register?ref= → OTP → შევსებული ფორმა → email OTP → პაროლი + თანხმობები → რეგისტრაცია */
  async registerViaLink(): Promise<Merchant> {
    const merchant = this.partner.merchant();
    const rep = merchant.members[0];
    rep.mobile = nextPreloadPhone();
    const body = await this.partner.prePopulateKyb([merchant]);
    expect(body.results[0].outcome).toBe('ACCEPTED');
    const ref = await this.partner.onboardingLink(merchant.fiscalCode);
    console.log(`🏢 ${merchant.businessName} | VAT ${merchant.vatNumber} | CF ${merchant.fiscalCode} | ${merchant.email} | rep ${rep.name} ${rep.surname} ${rep.fiscalCode} | +39 ${rep.mobile}`);

    await this.page.goto(`/register?ref=${ref}`);
    await this.otp.waitForScreen();
    await expect(this.page.getByText(`+39 *** *** ${rep.mobile.slice(-3)}`)).toBeVisible();
    await this.step('link opened → OTP screen');
    await this.otp.enterCode('111111');
    await this.page.getByRole('heading', { name: 'Enter your business details' }).waitFor();
    await this.step('OTP 111111');

    await this.compare('Registration', [
      ['Company name', 'name', merchant.businessName],
      ["Signer's name", 'legalRepresentativeName', rep.name],
      ["Signer's surname", 'legalRepresentativeSurname', rep.surname],
      ['Company tax code', 'personalNumber', merchant.fiscalCode],
      ['Email', 'email', merchant.email],
    ]);

    const sentAt = Date.now();
    await this.registration.clickVerify();
    const code = await new MailinatorHelper(merchant.email).getVerificationCode(60, sentAt - 10000);
    await this.otp.enterCode(code);
    await this.registration.confirmOtpSuccess();
    await this.step(`email OTP ${code}`);

    await this.page.getByRole('textbox', { name: 'Password', exact: true }).pressSequentially(TEST_DATA.password, { delay: 40 });
    await this.page.getByRole('textbox', { name: 'Confirm password' }).pressSequentially(TEST_DATA.password, { delay: 40 });
    await this.registration.acceptTerms();

    // Company tax code: ბექი წერს კომპანიის CF-ს (16), ფრონტი იღებს მხოლოდ 11 ციფრს → Continue გათიშული, ერორის გარეშე.
    // ბაგი soft-ად; გაიდი §4 VAT-საც უშვებს → VAT-ით ვაგრძელებთ
    const continueBtn = this.page.getByRole('button', { name: /^Continue$/ });
    const enabled = await continueBtn.isEnabled();
    console.log(`  ${enabled ? '✅' : '❌'} Continue with pre-filled Company tax code "${merchant.fiscalCode}" → ${enabled ? 'enabled' : 'disabled'}`);
    expect.soft(enabled, `Continue disabled with pre-filled company fiscal code ${merchant.fiscalCode}`).toBe(true);
    if (!enabled && process.env.BUG_SHOTS) await this.page.screenshot({ path: `${process.env.BUG_SHOTS}/kyb-registration-continue-disabled.png`, fullPage: true });
    if (!enabled) {
      const taxCode = this.page.getByRole('textbox', { name: 'Company tax code' });
      await taxCode.click();
      await taxCode.press('ControlOrMeta+a');
      await taxCode.pressSequentially(merchant.vatNumber, { delay: 30 });
      await taxCode.blur();
      await this.step(`Company tax code → VAT ${merchant.vatNumber}`);
    }
    const registered = this.page.waitForResponse((r) => r.url().includes('/auth/v2/web-registration') || r.url().includes('/api/v2/auth/web-registration'));
    await this.registration.clickContinue();
    expect((await registered).status(), 'web-registration').toBe(200);
    await this.step('registered → Signing agreement');
    return merchant;
  }

  /** 5. Yousign (OTP SMS → Gmail) → /on-boarding/WALLET (Wallet-ის არჩევა არ ჩანს) → 4 თანხმობა → Inizia il processo KYB */
  async signAgreementAndStartKyb() {
    this.business.email = TEST_DATA.kyc.email;
    await this.business.signAgreement();
    await this.page.waitForURL(/on-boarding\/WALLET/, { timeout: 30000 });
    await this.step('agreement signed');
    await this.wallet.acceptTerms();
    await this.wallet.startKyb();
    await this.step('KYB started');
  }

  /** 6. Azienda — CF (კომპანიის) / VAT / Ragione sociale / Forma (SR → SRL) / SAE / ATECO / REA / Data → Avanti */
  async checkAzienda(m: Merchant) {
    await this.page.locator('input[id="1.vat"]').waitFor();
    await this.compare('Azienda', [
      ['Codice Fiscale', '1.taxCode', m.fiscalCode],
      ['P.IVA', '1.vat', m.vatNumber],
      ['Ragione sociale', '1.name', m.businessName],
      ['Forma Giuridica', '1.type', 'SRL'],
      ['Codice SAE', '1.sae', m.sae],
      ['Codice ATECO', '1.ateco', m.ateco],
      ['REA', '1.rea', `${m.reaProvince}-${m.reaNumber}`],
      ['Data Iscrizione', '1.cciaaReaDate', this.dmy(m.reaDate)],
    ]);
    // Codice Fiscale: partner-ის 16-სიმბოლოიანი CF → "La lunghezza deve essere di 11 caratteri" (ბაგი, soft) → VAT-ით ვაგრძელებთ
    await this.wallet.clickAvanti();
    const lengthError = this.page.getByText('La lunghezza deve essere di 11 caratteri');
    const blocked = await lengthError.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  ${blocked ? '❌' : '✅'} Azienda Avanti with pre-filled Codice Fiscale "${m.fiscalCode}" → ${blocked ? '"La lunghezza deve essere di 11 caratteri"' : 'ok'}`);
    expect.soft(blocked, `Azienda: Codice Fiscale ${m.fiscalCode} rejected (11 characters required)`).toBe(false);
    // BUG_SHOTS=<dir> → ბაგების სქრინები ამ ფოლდერში; HOLD_AZIENDA=1 → ერორზე გაჩერება (ბრაუზერი ღიად, სქრინისთვის); გაგრძელება — Inspector-ში Resume
    if (blocked && process.env.BUG_SHOTS) await this.page.screenshot({ path: `${process.env.BUG_SHOTS}/kyb-azienda-codice-fiscale-error.png`, fullPage: true });
    if (blocked && process.env.HOLD_AZIENDA) await this.page.pause();
    if (blocked) {
      await this.wallet.setCompanyFiscalCode(m.vatNumber);
      await this.step(`Codice Fiscale → VAT ${m.vatNumber}`);
      await this.wallet.clickAvanti();
    }
    await this.step('Azienda → Avanti');
  }

  /** 7. Sede — legalAddress (Via Roma 10, 00100, Roma RM) + PEC + ტელეფონი → Avanti */
  async checkSede(m: Merchant) {
    await this.page.locator('input[id="2.streetOfLegal"]').waitFor();
    const a = m.legalAddress;
    await this.compare('Sede', [
      ['Indirizzo', '2.streetOfLegal', a.street],
      ['Numero', '2.houseNumberOfLegal', a.number],
      ['CAP', '2.zipcodeOfLegal', a.zipCode],
      ['Paese', '2.countryOfLegal', 'Italia'],
      ['Provincia', '2.provinceOfLegal', 'Roma'],
      ['Città', '2.cityOfLegal', a.cityName],
      ['PEC', '2.pec', m.pec],
      ['Telefono', '2.phone', m.phone],
    ]);
    await this.wallet.clickAvanti();
    await this.step('Sede → Avanti');
  }

  /** 8. Persone — წარმომადგენელი partner-იდან (შედარება) + Residenza / Cittadinanza (partner არ აგზავნის) → Avanti */
  async checkPersone(m: Merchant) {
    await this.page.locator('input[id="3.members.0.taxCode"]').waitFor();
    const r = m.members[0];
    await this.compare('Persone', [
      ['Nome', '3.members.0.name', r.name],
      ['Cognome', '3.members.0.surname', r.surname],
      ['Data di nascita', '3.members.0.dateOfBirth', this.dmy(r.birth.date)],
      ['Sesso', '3.members.0.gender', r.gender],
      ['Email', '3.members.0.email', r.email],
      ['Cellulare', '3.members.0.mobile', r.mobile],
      ['Paese di nascita', '3.members.0.countryName', 'Italia'],
      ['Provincia di nascita', '3.members.0.provName', 'Roma'],
      ['Città di nascita', '3.members.0.cityName', r.birth.cityName],
      ['Codice Fiscale', '3.members.0.taxCode', r.fiscalCode],
    ]);
    const p = TEST_DATA.walletKyb.rappresentante;
    await this.wallet.fillResidenceAndCitizenship({
      indirizzo: p.indirizzo,
      numero: p.numero,
      cap: p.cap,
      paeseResidenza: p.paeseResidenza,
      provinciaResidenza: p.provinciaResidenza,
      cittaResidenza: p.cittaResidenza,
      cittadinanza: p.cittadinanza,
    });
    await this.step('Persone — residenza + cittadinanza');
    await this.wallet.clickAvanti();
    await this.step('Persone → Avanti');
  }

  /** 9-12. PEP (No) → AML → Documenti (Visura + Carta d'Identità) → Firma → Video → LIVENESS_PENDING */
  async finishKyb(m: Merchant) {
    await this.wallet.fillPep([{ index: 0, ...TEST_DATA.walletKyb.pep.none, usaTaxpayer: false }]);
    await this.wallet.clickAvanti();
    await this.step('PEP → Avanti');

    await this.wallet.fillAml(TEST_DATA.walletKyb.aml);
    await this.wallet.clickAvanti();
    await this.step('AML → Avanti');

    const d = TEST_DATA.walletKyb.documenti;
    const r = m.members[0];
    await this.wallet.fillDocumenti({
      companyFile: d.companyFile,
      persons: [
        {
          cardName: `${r.name} ${r.surname}`,
          tipoDocumento: d.tipoDocumento,
          personFiles: [d.personFile, d.personFileBack],
          numeroDocumento: d.numeroDocumento,
          dataRilascio: d.dataRilascio,
          dataScadenza: d.dataScadenza,
          enteRilascio: TEST_DATA.enteRilascio.cartaIdentita,
          luogoRilascio: d.luogoRilascio,
        },
      ],
    });
    await this.wallet.clickAvanti();
    await this.step('Documenti → Avanti');

    await this.wallet.clickFirma();
    await this.wallet.signContract();
    await this.step('Firma (ორმაგი ხელმოწერა)');
    await this.wallet.startVideoVerification();
    await this.assertLiveness();
    console.log(`🏆 pre-loaded KYB onboarding complete — ${m.businessName} (VAT ${m.vatNumber})`);
  }

  /** profile/details → verificationInfo.tppay.status = LIVENESS_PENDING */
  private async assertLiveness() {
    const isLiveness = () => /LIVENESS_PENDING|LIVENESS|PENDING|REVIEW/i.test(this.business.tppayStatus || '');
    for (let i = 0; i < 40 && !isLiveness(); i++) await this.page.waitForTimeout(500);
    if (!isLiveness()) {
      await this.page.reload().catch(() => {});
      for (let i = 0; i < 20 && !isLiveness(); i++) await this.page.waitForTimeout(500);
    }
    console.log('🎥 Tppay status:', this.business.tppayStatus);
    expect(this.business.tppayStatus, 'Tppay status').toMatch(/LIVENESS_PENDING|LIVENESS|PENDING|REVIEW/i);
  }
}
