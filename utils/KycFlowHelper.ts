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
import { randomName } from './randomData';
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

    // userId-ის დაჭერა profile/details response-იდან
    page.on('response', async (res) => {
      if (res.url().includes('/api/v1/profile/details') && res.ok()) {
        try {
          const body = await res.json();
          const uid = body?.value?.userId ?? body?.userId;
          if (uid) this.userId = uid;
        } catch {
          /* ignore non-json */
        }
      }
    });
  }

  /**
   * ეტაპი 1 — ახალი ინდივიდუალური იუზერის რეგისტრაცია.
   * phone → OTP → Individual → სახელი/გვარი/პაროლი → Verify.
   */
  async registerIndividual(phone: string = TEST_DATA.phone) {
    await this.login.open();
    await this.login.login(phone);
    await this.otp.waitForScreen();
    await this.otp.enterCode(TEST_DATA.otp);

    await this.accountType.chooseIndividual();
    await this.kyc.clickContinue();

    await this.kyc.fillRegistration({
      firstName: this.person.firstName,
      lastName: this.person.lastName,
      password: TEST_DATA.password,
    });
    await this.kyc.acceptTerms();
    await this.kyc.clickContinue();
    await this.kyc.clickVerify();
  }

  /**
   * ეტაპი 2 — email ვერიფიკაცია.
   * Inizia → email → Invia OTP → Gmail-იდან კოდის წაკითხვა → 3 თანხმობა → Continua.
   */
  async verifyEmail(email: string = TEST_DATA.kyc.email) {
    await this.verification.start();
    await this.verification.enterEmail(email);

    // OTP-ის გაგზავნის დრო — მხოლოდ ამის შემდეგ მოსული მეილი წავიკითხოთ
    // (თანმიმდევრული ტესტები ერთ inbox-ს იყენებენ → ძველ OTP-ს ავცდეთ)
    const sentAt = Date.now();
    await this.verification.sendEmailOtp();

    const emailHelper = new EmailHelper(
      process.env.GMAIL_USER || email,
      process.env.GMAIL_APP_PASSWORD || ''
    );
    const code = await emailHelper.getVerificationCode(40, 'noreply@keepz.it', sentAt - 10000);

    await this.verification.enterEmailOtp(code);
    await this.verification.acceptTerms();
    await this.verification.clickContinua();
  }

  /**
   * ეტაპი 3 — KYC wizard: პირადი მონაცემები → დოკუმენტი → AML კითხვარი.
   * ⚠️ AML-ის შემდეგ (Firma/Video) ამჟამად app bug-ია — დაემატება fix-ის შემდეგ.
   */
  async completeKycWizard(document: Partial<typeof TEST_DATA.kycDocument> = {}) {
    await this.personal.fillPage(TEST_DATA.kycPersonal);
    await this.personal.clickAvanti();

    // document — default მონაცემები + override (მაგ. documentType: 'Patente')
    await this.document.fillPage({ ...TEST_DATA.kycDocument, ...document });
    await this.document.clickAvanti();

    await this.financial.fillPage(TEST_DATA.kycFinancial);
    await this.financial.clickAvanti();
  }

  // ─────────────── high-level (ტესტებში ერთხაზიანი გამოძახება) ───────────────

  /** რეგისტრაცია + ვერიფიკაციის ეტაპამდე მისვლის ასერტი */
  async register(phone: string = TEST_DATA.phone) {
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
    } = {}
  ) {
    await this.registerIndividual(opts.phone);
    await this.verifyEmail(opts.email);
    await this.completeKycWizard(opts.document);
    await expect(this.page).toHaveURL(/on-boarding/i);
  }
}