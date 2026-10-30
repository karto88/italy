import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';
import { AccountTypePage } from '../pages/AccountTypePage';
import { KycPage } from '../pages/KycPage';
import { KycVerificationPage } from '../pages/KycVerificationPage';
import { KycPersonalDataPage } from '../pages/KycPersonalDataPage';
import { KycDocumentPage } from '../pages/KycDocumentPage';
import { KycFinancialPage } from '../pages/KycFinancialPage';
import { EmailHelper } from './EmailHelper';
import { MailinatorHelper } from './MailinatorHelper';
import { randomName, nextPhone, uniqueEmail } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * KycFlowHelper — ITALY KYC onboarding-ის სრული UI flow-ის ორკესტრაცია.
 * აერთიანებს ყველა Page Object-ს. ტესტები იძახებენ ამ high-level ნაბიჯებს.
 *
 * `userId` — რეგისტრაციისას profile/details-იდან დაჭერილი (admin cleanup-ისთვის).
 */
export class KycFlowHelper {
  private login: LoginPage;
  private otp: OtpPage;
  private accountType: AccountTypePage;
  private kyc: KycPage;
  private verification: KycVerificationPage;
  private personal: KycPersonalDataPage;
  private document: KycDocumentPage;
  private financial: KycFinancialPage;

  /** შექმნილი იუზერის userId (cleanup-ისთვის) */
  userId: string | null = null;

  /** ამ ტესტის random სახელი/გვარი */
  readonly person = randomName();

  constructor(private page: Page) {
    this.login = new LoginPage(page);
    this.otp = new OtpPage(page);
    this.accountType = new AccountTypePage(page);
    this.kyc = new KycPage(page);
    this.verification = new KycVerificationPage(page);
    this.personal = new KycPersonalDataPage(page);
    this.document = new KycDocumentPage(page);
    this.financial = new KycFinancialPage(page);

    // userId + verification summary დაჭერა response-ებიდან
    page.on('response', async (res) => {
      const url = res.url();
      if (!res.ok()) return;
      if (url.includes('/api/v1/profile/details')) {
        try {
          const body = await res.json();
          const val = body?.value ?? body;
          if (val?.userId) this.userId = val.userId;
          if (val?.verificationStatus) this.verificationStatus = val.verificationStatus;
          // Tppay/Nuvei ვერიფიკაციის სტატუსი (liveness-ზე → LIVENESS_PENDING)
          if (val?.verificationInfo?.tppay?.status) this.tppayStatus = val.verificationInfo.tppay.status;
          if (val?.verificationInfo?.nuvei?.status) this.nuveiStatus = val.verificationInfo.nuvei.status;
        } catch {
          /* ignore */
        }
      } else if (url.includes('/api/v1/profile/verification/summary')) {
        try {
          const body = await res.json();
          this.summary = body?.value?.data ?? body?.data ?? body?.value ?? body;
        } catch {
          /* ignore */
        }
      }
    });

    // 🔎 KI-254 DISCOVERY: kycData request payload-ის დაჭერა (code vs label)
    if (process.env.CAPTURE_KYC) {
      page.on('request', (req) => {
        if (req.method() !== 'POST') return;
        const body = req.postData() || '';
        if (/kycData|amlPep|Q_ASSET|QP_|amlFiscal|census/i.test(body)) {
          console.log('KYCDATA_REQ ' + req.url() + ' :: ' + body.slice(0, 4000));
        }
      });
    }
  }

  /** Firma-ს summary API response (შევსებული მონაცემები დასავალიდაციებლად) */
  summary: any = null;

  /** იუზერის ვერიფიკაციის სტატუსი (profile/details-იდან) */
  verificationStatus: string | null = null;

  /** Tppay/Nuvei ვერიფიკაციის სტატუსი (verificationInfo.*.status) */
  tppayStatus: string | null = null;
  nuveiStatus: string | null = null;

  /**
   * ეტაპი 1 — ახალი ინდივიდუალური იუზერის რეგისტრაცია.
   * phone → OTP → Individual → სახელი/გვარი/პაროლი → Verify.
   */
  async registerIndividual(phone: string = nextPhone()) {
    console.log(`📱 Phone: ${phone} | 👤 ${this.person.firstName} ${this.person.lastName}`);
    await this.login.open();
    await this.login.login(phone);
    await this.otp.waitForScreen();
    await this.otp.enterCode(TEST_DATA.otp);
    console.log('✅ Login OK (phone + SMS OTP)');

    await this.accountType.chooseIndividual();
    await this.kyc.clickContinue();

    await this.kyc.fillRegistration({
      firstName: this.person.firstName,
      lastName: this.person.lastName,
      password: TEST_DATA.password,
    });
    await this.kyc.acceptTerms();
    await this.kyc.clickContinue();
    await this.kyc.startKycProcess();
    console.log('✅ Registration submitted');
  }

  /**
   * ეტაპი 2 — email ვერიფიკაცია.
   * email → Invia OTP → Gmail-იდან კოდის წაკითხვა → 3 თანხმობა → Continua.
   * (Registration-ის "Inizia il processo KYC" პირდაპირ ამ "Verifica Email" გვერდზე გადმოგდის — ცალკე start აღარ სჭირდება.)
   */
  async verifyEmail(email: string = uniqueEmail('d.kartozia', 'keepz.me')) {
    await this.verification.enterEmail(email);
    console.log('📧 KYC email:', email);

    // OTP-ის გაგზავნის დრო — მხოლოდ ამის შემდეგ მოსული მეილი წავიკითხოთ
    // (თანმიმდევრული ტესტები ერთ inbox-ს იყენებენ → ძველ OTP-ს ავცდეთ)
    const sentAt = Date.now();
    await this.verification.sendEmailOtp();

    // mailinator.com email → public inbox (HTTP, auth არ სჭირდება); სხვა შემთხვევაში Gmail (+N plus-addressing)
    const code = email.toLowerCase().endsWith('@mailinator.com')
      ? await new MailinatorHelper(email).getVerificationCode(60, sentAt - 10000)
      : await new EmailHelper(
          process.env.GMAIL_USER || 'd.kartozia@keepz.me',
          process.env.GMAIL_APP_PASSWORD || ''
        ).getVerificationCode(60, 'noreply@keepz.it', sentAt - 10000);

    await this.verification.enterEmailOtp(code);
    await this.verification.acceptTerms();
    await this.verification.clickContinua();
    console.log('✅ Email verified');
  }

  /**
   * ეტაპი 3 — KYC wizard: პირადი მონაცემები → დოკუმენტი → AML კითხვარი.
   * ⚠️ AML-ის შემდეგ (Firma/Video) ამჟამად app bug-ია — დაემატება fix-ის შემდეგ.
   */
  async completeKycWizard(
    document: Partial<typeof TEST_DATA.kycDocument> = {},
    pep: any = TEST_DATA.pep.none,
    personal: Partial<typeof TEST_DATA.kycPersonal> = {}
  ) {
    await this.personal.fillPage({ ...TEST_DATA.kycPersonal, ...personal }, pep);

    // 🔎 DISCOVERY: personal data გვერდზე გაჩერება (Cittadinanza / residence permit)
    if (process.env.HOLD_KYC) await this.page.pause();

    await this.personal.clickAvanti();
    console.log(`✅ Personal data (PEP: ${pep.relationship})`);

    // document — default მონაცემები + override (მაგ. documentType: 'Patente')
    // ⚠️ documentType override-ისას issuingAuthority-იც უნდა შეესაბამებოდეს (KI-175 mapping) —
    // თუ ცალკე არ არის მითითებული, ავტომატურად resolve-დება resolveEnteRilascio()-ით.
    const documentType = document.documentType ?? TEST_DATA.kycDocument.documentType;
    const issuingAuthority = document.issuingAuthority ?? this.resolveEnteRilascio(documentType);
    await this.document.fillPage({ ...TEST_DATA.kycDocument, ...document, issuingAuthority });
    await this.document.clickAvanti();
    console.log(`✅ Document (${documentType} → ${issuingAuthority})`);

    await this.financial.fillPage(TEST_DATA.kycFinancial);
    await this.financial.clickAvanti();
    console.log('✅ AML questionnaire');
  }

  /**
   * ეტაპი 4 — Firma (Riepilogo e Firma Digitale).
   * ამოწმებს summary API-ს (შევსებული data დაბრუნდა) → Firma → scroll.
   */
  async signKyc() {
    // summary API-ის დაცდა (Firma გვერდის ჩატვირთვისას იძახება) — 20წმ
    for (let i = 0; i < 40 && !this.summary; i++) {
      await this.page.waitForTimeout(500);
    }
    expect(this.summary, 'verification summary API არ დაიჭირა').toBeTruthy();
    const s = JSON.stringify(this.summary);
    expect(s).toContain('Italia'); // Nazionalità/Cittadinanza შევსებული
    console.log('✅ Summary data verified (შევსებული მონაცემები სწორია)');

    await this.signContract();

    // Avvia verifica video → liveness (status: CONTRACT_SIGNED → LIVENESS_PENDING)
    await this.page.getByRole('button', { name: 'Avvia verifica video' }).click();

    // დაველოდოთ LIVENESS_PENDING-ს (liveness გვერდი profile/details-ს ხელახლა იძახებს)
    const isLiveness = () => /LIVENESS_PENDING|LIVENESS|PENDING|REVIEW/i.test(this.tppayStatus || '');
    for (let i = 0; i < 40 && !isLiveness(); i++) {
      await this.page.waitForTimeout(500);
    }
    // fallback — თუ ჯერ არ განახლდა, reload-ით ვაიძულოთ fresh profile/details
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
    console.log('🏆 Individual passed Tppay verification → liveness (LIVENESS_PENDING)');
  }

  /** summary Firma → Yousign ორმაგი ხელმოწერა (სტატიკური SMS OTP) → Video გვერდი */
  private async signContract() {
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
    // Yousign ხელმოწერა — ორმაგი, სტატიკური SMS OTP (12345678)
    const SMS = '12345678';
    // 1-ლი ხელმოწერა — დოკუმენტი ბოლომდე ჩავასქროლოთ სანამ "Firma 1 / N" გააქტიურდება
    const firma1 = this.page.getByRole('button', { name: 'Firma 1 /' });
    for (let i = 0; i < 30 && !(await firma1.isEnabled().catch(() => false)); i++) {
      // ყველა scrollable კონტეინერი (nested-იც) ბოლომდე
      await this.page.evaluate(() => {
        document.querySelectorAll('*').forEach((el) => {
          if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight;
        });
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(400);
    }
    await firma1.click();
    await this.enterSmsOtp(SMS);
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
    // 2-ე ხელმოწერა
    await this.page.getByRole('button', { name: 'Continua alla firma' }).click();
    await this.enterSmsOtp(SMS);
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
    console.log('✅ Signature complete (ორმაგი ხელმოწერა)');
  }

  /**
   * KI-173 — Ricomincia ქეისი (Individual): KYC Video-მდე → Ricomincia → KYC თავიდან Video-მდე.
   *   change 'personCf' → Personal data: სხვა დაბადება/სქესი → სხვა CF
   *   change 'none'     → იგივე მონაცემები (საკონტროლო)
   * ლოგში: 🪪 CF ორივე რაუნდში, 🚨 API ერორები სრული body-ით. ბოლოს liveness-მდე ჩერდება.
   */
  async ricomincia(change: 'personCf' | 'none', opts: { beforeSign?: boolean } = {}): Promise<'passed' | 'blocked'> {
    this.page.on('response', async (res) => {
      if (res.status() >= 400 && /\/api\//.test(res.url())) {
        const body = await res.text().catch(() => '');
        console.log(`🚨 ${res.status()} ${res.request().method()} ${res.url()}\n   ${body.slice(0, 500)}`);
      }
    });
    await this.registerIndividual();
    await this.verifyEmail();

    console.log(`━━ ROUND 1${opts.beforeSign ? ' (Firma-მდე, ხელმოწერის გარეშე)' : ''}`);
    await this.fillKycUntilVideo({}, opts.beforeSign);

    await this.page.getByRole('button', { name: 'Ricomincia' }).click();
    await this.page.getByText('Sei sicuro?').waitFor({ state: 'visible' });
    await this.page.getByRole('button', { name: 'Ricomincia' }).last().click();
    await this.page.getByText('Sei sicuro?').waitFor({ state: 'hidden' });
    console.log('🔁 Ricomincia');

    console.log(`━━ ROUND 2 (change: ${change})`);
    this.summary = null;
    const result = await this.raceProcessStarted(
      this.fillKycUntilVideo(change === 'personCf' ? { birthDate: '10071992', gender: 'F' } : {})
    );
    console.log(result === 'passed' ? '✅ round 2 reached Video' : "⛔ round 2 — 3116 Processo già avviato per l'utente");
    if (process.env.HOLD) await this.page.pause();
    return result;
  }

  /**
   * User existence check (KI-173) — Firma-მდე (ხელმოწერის გარეშე) → Ricomincia → თავიდან.
   * expected: 'blocked' → TPPay 3116 უნდა დააბრუნოს; 'passed' → Video-მდე უნდა მივიდეს.
   */
  async userExistenceCheck(change: 'personCf' | 'none', expected: 'passed' | 'blocked') {
    const result = await this.ricomincia(change, { beforeSign: true });
    expect(result, `Ricomincia → ${change}: მოსალოდნელი ${expected}, მიიღო ${result}`).toBe(expected);
  }

  /**
   * მეორე რაუნდის შევსება ↔ 3116 ("Processo già avviato per l'utente") — რომელიც პირველი მოხდება.
   * 'blocked' — TPPay-მ 3116 დააბრუნა; 'passed' — Video-მდე მივიდა.
   */
  private async raceProcessStarted(fill: Promise<void>): Promise<'passed' | 'blocked'> {
    const blocked = this.page
      .waitForResponse(
        async (res) =>
          /\/profile\/verification\/page\//.test(res.url()) &&
          res.status() >= 400 &&
          (await res.text().catch(() => '')).includes('"statusCode":3116'),
        { timeout: 0 }
      )
      .then(() => 'blocked' as const);
    const done = fill.then(() => 'passed' as const);
    // დამარცხებული promise-ის rejection (page დახურვა) არ უნდა ჩავარდეს unhandled-ად
    blocked.catch(() => {});
    done.catch(() => {});
    return Promise.race([done, blocked]);
  }

  /** Personal data → Document → AML → Firma (Video-მდე); personal — override */
  private async fillKycUntilVideo(personal: Partial<typeof TEST_DATA.kycPersonal> = {}, stopBeforeSign = false) {
    await this.personal.fillPage({ ...TEST_DATA.kycPersonal, ...personal }, TEST_DATA.pep.none);
    const cf = await this.page.evaluate(() =>
      [...document.querySelectorAll('input')].map((i) => i.value).find((v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v))
    );
    console.log(`🪪 CF: ${cf}`);
    await this.personal.clickAvanti();
    console.log('✅ Personal data');

    const documentType = TEST_DATA.kycDocument.documentType;
    await this.document.fillPage({ ...TEST_DATA.kycDocument, issuingAuthority: this.resolveEnteRilascio(documentType) });
    await this.document.clickAvanti();
    console.log('✅ Document');

    await this.financial.fillPage(TEST_DATA.kycFinancial);
    await this.financial.clickAvanti();
    console.log('✅ AML questionnaire');
    if (stopBeforeSign) {
      console.log('✋ Firma გვერდი — ხელმოწერის გარეშე');
      return;
    }

    await this.signContract();
    console.log('✅ Firma → Video');
  }

  /** documentType → სწორი Ente rilascio (KI-175 mapping). Passaporto default → Questura (იტალიაში გაცემული). */
  private resolveEnteRilascio(tipo: string): string {
    const { documentTypes: dt, enteRilascio: map } = TEST_DATA;
    switch (tipo) {
      case dt.cartaIdentita:
        return map.cartaIdentita;
      case dt.patente:
        return map.patente;
      case dt.passaporto:
        return map.passaportoItalia;
      default:
        return map.permessoSoggiorno;
    }
  }

  /** SMS OTP ველის შევსება (Inserisci il codice SMS *) */
  private async enterSmsOtp(code: string) {
    const field = this.page.getByRole('spinbutton', { name: 'Inserisci il codice SMS *' });
    await field.click();
    await field.fill('');
    await field.pressSequentially(code, { delay: 40 });
  }

  // ─────────────── high-level (ტესტებში ერთხაზიანი გამოძახება) ───────────────

  /** რეგისტრაცია + ვერიფიკაციის ეტაპამდე მისვლის ასერტი */
  async register(phone: string = nextPhone()) {
    await this.registerIndividual(phone);
    await expect(this.page).not.toHaveURL(/register\/?$/);
  }

  /**
   * სრული onboarding: register → email verify → KYC wizard (AML-მდე) + ასერტი.
   * opts.document — დოკუმენტის მონაცემების override (მაგ. { documentType: 'Patente' }).
   */
  async completeOnboarding(
    opts: {
      phone?: string;
      email?: string;
      document?: Partial<typeof TEST_DATA.kycDocument>;
      pep?: any;
      personal?: Partial<typeof TEST_DATA.kycPersonal>; // personal data override (მაგ. non-EU citizenship)
      sign?: boolean; // true → Firma summary validation + Firma + scroll
    } = {}
  ) {
    await this.registerIndividual(opts.phone);
    await this.verifyEmail(opts.email);
    await this.completeKycWizard(opts.document, opts.pep ?? TEST_DATA.pep.none, opts.personal);
    await expect(this.page).toHaveURL(/on-boarding/i);
    if (opts.sign) await this.signKyc();
  }
}