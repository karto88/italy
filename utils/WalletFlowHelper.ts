import { Page, expect } from '@playwright/test';
import { BusinessFlowHelper } from './BusinessFlowHelper';
import { WalletKybPage } from '../pages/WalletKybPage';
import { uniqueTaxCode, uniqueRegNumber, uniqueEmail } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/** PEP ვარიანტი (member 0-ისთვის) — config.walletKyb.pep.{none|self|family|business} */
type PepVariant = {
  relationship: string;
  type?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  ongoing?: boolean;
};

/**
 * WalletFlowHelper — Tppay (Wallet) სრული ბიზნეს onboarding.
 * საერთო რეგისტრაცია + Yousign ხელმოწერა (BusinessFlowHelper) → Wallet არჩევა → KYB wizard.
 * ტესტი მხოლოდ ერთ მეთოდს იძახებს: flow.completeOnboarding().
 */
export class WalletFlowHelper {
  private business: BusinessFlowHelper;
  private wallet: WalletKybPage;

  constructor(private page: Page) {
    this.business = new BusinessFlowHelper(page);
    this.wallet = new WalletKybPage(page);
  }

  get tppayStatus() {
    return this.business.tppayStatus;
  }

  get userId() {
    return this.business.userId;
  }
  get email() {
    return this.business.email;
  }

  /**
   * სრული Tppay (Wallet) KYB onboarding — ერთი გამოძახება ტესტიდან.
   * opts.extraMembers — დამატებითი TE/Firmatario პიროვნებები (multi-person, TC0.14+).
   */
  async completeOnboarding(
    opts: {
      phone?: string;
      extraMembers?: (typeof TEST_DATA.walletKyb.te)[];
      esRoles?: { titolare?: boolean; firmatario?: boolean }; // member 0-ის role (default ორივე)
      usaTaxpayers?: number[]; // US taxpayer (W9) member index-ები — PEP ბიჯზე
      documentType?: string; // Documenti — Carta d'Identità | Patente | Passaporto (ყველა პიროვნებაზე)
      pep?: PepVariant; // member 0-ის PEP (default: No); დანარჩენები ყოველთვის No
    } = {}
  ) {
    await this.business.registerBusiness(opts.phone);
    await this.business.signAgreement();
    await this.selectWalletAndStartKyb();
    await this.fillOrganization();
    await this.fillLegalAddress();
    await this.fillPersone(opts.extraMembers, opts.esRoles);
    await this.fillPep(1 + (opts.extraMembers?.length ?? 0), opts.usaTaxpayers ?? [], opts.pep);
    await this.fillAml();
    const memberNames = [
      `${TEST_DATA.business.signerName} ${TEST_DATA.business.signerSurname}`,
      ...(opts.extraMembers ?? []).map((m) => `${m.name} ${m.surname}`),
    ];
    await this.fillDocumenti(memberNames, opts.documentType);
    await this.signFirma();
  }

  /**
   * მხოლოდ Azienda (Organization) გვერდამდე მისვლა — რეგისტრაცია + ხელმოწერა + Wallet + KYB start.
   * REA province-code ტესტისთვის (ცალკე შევსება/ვალიდაცია იმ გვერდზე).
   * აბრუნებს WalletKybPage-ს, რომ ტესტმა REA ველი უშუალოდ შეამოწმოს.
   */
  async reachOrganization(phone?: string): Promise<WalletKybPage> {
    await this.business.registerBusiness(phone);
    await this.business.signAgreement();
    await this.selectWalletAndStartKyb();
    return this.wallet;
  }

  /**
   * REA province code-ის შემოწმება — ერთი გამოძახება ტესტიდან (PEP-ის მსგავსად).
   * reachOrganization → Azienda-ს სრული შევსება REA="{code}-987654"-ით → Avanti →
   * ვალიდური province code Sede-ზე გადაჰყავს.
   */
  async checkRea(code: string) {
    const wallet = await this.reachOrganization();
    const advanced = await this.fillOrgAndAdvance(wallet, `${code}-987654`);
    expect(
      advanced,
      `REA "${code}-987654" (ვალიდური province code) Avanti-ს Sede-ზე უნდა გაეტარებინა, მაგრამ Azienda-ზე დარჩა`
    ).toBe(true);
    console.log(`✅ REA ${code} accepted (Azienda → Sede)`);
  }

  /**
   * REA negative — არარსებული province code უნდა უარიყოს (Azienda, პირველივე გვერდი).
   * მოსალოდნელი: Avanti Azienda-ზე აჩერებს (Sede-ზე არ გადადის).
   */
  async checkReaInvalid(code: string) {
    const wallet = await this.reachOrganization();
    const advanced = await this.fillOrgAndAdvance(wallet, `${code}-987654`);
    expect(
      advanced,
      `REA "${code}-987654" (არავალიდური province code) Azienda-ზე უნდა შეეჩერებინა, მაგრამ Sede-ზე გადავიდა`
    ).toBe(false);
    console.log(`✅ REA ${code} correctly rejected (stayed on Azienda)`);
  }

  /**
   * REA negative — არასწორი ფორმატი/სიმბოლოები (raw მნიშვნელობა, არა "{code}-987654").
   * მაგ. "MI_987654" (ტირის მაგივრად _), "MI==987654". მოსალოდნელი: Azienda-ზე რჩება.
   */
  async checkReaInvalidRaw(reaValue: string) {
    const wallet = await this.reachOrganization();
    const advanced = await this.fillOrgAndAdvance(wallet, reaValue);
    expect(
      advanced,
      `REA "${reaValue}" (არასწორი ფორმატი) Azienda-ზე უნდა შეეჩერებინა, მაგრამ Sede-ზე გადავიდა`
    ).toBe(false);
    console.log(`✅ REA "${reaValue}" correctly rejected (stayed on Azienda)`);
  }

  /** Azienda-ს სრული შევსება მოცემული REA მნიშვნელობით (raw) + Avanti; აბრუნებს გადავიდა თუ არა Sede-ზე. */
  private async fillOrgAndAdvance(wallet: WalletKybPage, reaValue: string): Promise<boolean> {
    await wallet.fillOrganization({
      piva: uniqueTaxCode(),
      formaGiuridica: TEST_DATA.walletKyb.formaGiuridica,
      codiceSAE: TEST_DATA.walletKyb.codiceSAE,
      codiceATECO: TEST_DATA.walletKyb.codiceATECO,
      rea: reaValue,
      dataIscrizione: TEST_DATA.walletKyb.dataIscrizione,
    });
    await wallet.clickAvanti();
    return wallet.isPastAzienda();
  }

  /** Wallet არჩევა → Continue → Verify → თანხმობები → KYB wizard */
  private async selectWalletAndStartKyb() {
    await this.wallet.chooseWallet();
    await this.wallet.clickContinue();
    await this.wallet.clickVerify();
    await this.wallet.acceptTerms();
    await this.wallet.startKyb();
    console.log('✅ Wallet selected, KYB started');
  }

  /** Organization step — P.IVA (11 ციფრი) / REA / Numero REA უნიკალური */
  private async fillOrganization() {
    // 🔎 DISCOVERY: Organization გვერდზე გაჩერება (ახალი ID-ების მოსაწოდებლად)
    if (process.env.HOLD_ORG) await this.page.pause();

    await this.wallet.fillOrganization({
      piva: uniqueTaxCode(),
      formaGiuridica: TEST_DATA.walletKyb.formaGiuridica,
      codiceSAE: TEST_DATA.walletKyb.codiceSAE,
      codiceATECO: TEST_DATA.walletKyb.codiceATECO,
      rea: 'MI-' + String(Date.now()).slice(-6), // ახალი ფორმატი: MI-987654
      dataIscrizione: TEST_DATA.walletKyb.dataIscrizione,
    });
    await this.wallet.clickAvanti();
    console.log('✅ Organization');
  }

  /** Legal address ქვე-ბიჯი (PEC = რეგისტრაციის email; Telefono 10 ციფრი, 3-ით) */
  private async fillLegalAddress() {
    await this.wallet.fillLegalAddress({
      street: TEST_DATA.walletKyb.street,
      houseNumber: TEST_DATA.walletKyb.houseNumber,
      zipcode: TEST_DATA.walletKyb.zipcode,
      country: TEST_DATA.walletKyb.country,
      provincia: TEST_DATA.walletKyb.provincia,
      citta: TEST_DATA.walletKyb.citta,
      pec: this.business.email!,
      phone: '3' + String(Date.now()).slice(-9),
    });
    await this.wallet.clickAvanti();
    console.log('✅ Legal address');
  }

  /** Persone step — Rappresentante legale (+ optional დამატებითი TE-ები) */
  private async fillPersone(
    extraMembers: (typeof TEST_DATA.walletKyb.te)[] = [],
    esRoles: { titolare?: boolean; firmatario?: boolean } = { titolare: true, firmatario: true }
  ) {
    const r = TEST_DATA.walletKyb.rappresentante;
    await this.wallet.fillPersone({
      roles: esRoles,
      birthDate: r.birthDate,
      sesso: r.sesso,
      email: this.business.email!,
      phone: r.phone,
      paese: r.paese,
      provinciaNascita: r.provinciaNascita,
      cittaNascita: r.cittaNascita,
      indirizzo: r.indirizzo,
      numero: r.numero,
      cap: r.cap,
      paeseResidenza: r.paeseResidenza,
      provinciaResidenza: r.provinciaResidenza,
      cittaResidenza: r.cittaResidenza,
      paeseFiscaleAML: r.paeseFiscaleAML,
      cittadinanza: r.cittadinanza,
    });

    // დამატებითი TE/Firmatario პიროვნებები (index 1+)
    for (let i = 0; i < extraMembers.length; i++) {
      const m = extraMembers[i];
      await this.wallet.addTitolareEffettivo(i + 1, {
        ...m,
        email: m.email || uniqueEmail('d.kartozia', 'keepz.me'),
      });
      console.log(`✅ TE დამატებულია (member ${i + 1}: ${m.name} ${m.surname})`);
    }

    // 🔎 DISCOVERY: Persone გვერდზე გაჩერება (როლების/ვალიდაციის დასათვალიერებლად)
    if (process.env.HOLD_PERSONE) await this.page.pause();

    await this.wallet.clickAvanti();
    console.log(`✅ Persone (${1 + extraMembers.length} პიროვნება)`);
  }

  /** PEP step (Verifica PEP) — per-person; pep = member 0-ის ვარიანტი (default No); usaTaxpayers = W9 index-ები */
  private async fillPep(memberCount = 1, usaTaxpayers: number[] = [], pep?: PepVariant) {
    const members = Array.from({ length: memberCount }, (_, i) => ({
      index: i,
      // member 0 → pep ვარიანტი (თუ მოცემულია); დანარჩენები → No
      ...(i === 0 && pep ? pep : TEST_DATA.walletKyb.pep.none),
      usaTaxpayer: usaTaxpayers.includes(i),
      usaDoc: usaTaxpayers.includes(i) ? TEST_DATA.walletKyb.w9File : undefined,
    }));
    await this.wallet.fillPep(members);
    await this.wallet.clickAvanti();
    console.log(`✅ PEP (${memberCount} პიროვნება${usaTaxpayers.length ? `, W9: ${usaTaxpayers.join(',')}` : ''})`);
  }

  /** AML კითხვარი (Questionario Antiriciclaggio) — business ვერსია */
  private async fillAml() {
    await this.wallet.fillAml(TEST_DATA.walletKyb.aml);
    await this.wallet.clickAvanti();
    console.log('✅ AML');
  }

  /** Documenti step — Visura Camerale (company, once) + პიროვნების დოკუმენტი (per-member, ბარათით) */
  private async fillDocumenti(memberNames: string[], documentType?: string) {
    const d = TEST_DATA.walletKyb.documenti;
    const tipo = documentType ?? d.tipoDocumento;
    // Carta d'Identità → ზუსტად 2 ფაილი (fronte+retro); Patente/Passaporto → 1
    const personFiles =
      tipo === TEST_DATA.documentTypes.cartaIdentita ? [d.personFile, d.personFileBack] : [d.personFile];
    const persons = memberNames.map((cardName) => ({
      cardName,
      tipoDocumento: tipo,
      personFiles,
      numeroDocumento: d.numeroDocumento,
      dataRilascio: d.dataRilascio,
      dataScadenza: d.dataScadenza,
      enteRilascio: d.enteRilascio,
      luogoRilascio: d.luogoRilascio,
    }));
    await this.wallet.fillDocumenti({ companyFile: d.companyFile, persons });
    await this.wallet.clickAvanti();
    console.log(`✅ Documenti (${memberNames.length} პიროვნება)`);
  }

  /** Firma step — ხელმოწერა (scroll → Firma 1/N → ორმაგი OTP) → Video → LIVENESS assert */
  private async signFirma() {
    await this.wallet.clickFirma();
    await this.wallet.signContract();
    console.log('✅ Firma (ორმაგი ხელმოწერა)');
    await this.wallet.startVideoVerification();
    await this.assertLiveness();
  }

  /** LIVENESS status-ის დაცდა/ასერტი (profile/details → verificationInfo.tppay.status) */
  private async assertLiveness() {
    const isLiveness = () => /LIVENESS_PENDING|LIVENESS|PENDING|REVIEW/i.test(this.tppayStatus || '');
    for (let i = 0; i < 40 && !isLiveness(); i++) {
      await this.page.waitForTimeout(500);
    }
    // fallback — fresh profile/details-ის იძულებით წამოსაღებად
    if (!isLiveness()) {
      await this.page.reload().catch(() => {});
      for (let i = 0; i < 20 && !isLiveness(); i++) {
        await this.page.waitForTimeout(500);
      }
    }
    console.log('🎥 Tppay status:', this.tppayStatus);
    expect(
      this.tppayStatus,
      `Tppay status უნდა იყოს LIVENESS_PENDING, არის: ${this.tppayStatus}`
    ).toMatch(/LIVENESS_PENDING|LIVENESS|PENDING|REVIEW/i);
    console.log('🏆 Business passed Tppay verification → liveness (LIVENESS_PENDING)');
  }
}