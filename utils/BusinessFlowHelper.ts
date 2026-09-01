import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';
import { AccountTypePage } from '../pages/AccountTypePage';
import { BusinessRegistrationPage } from '../pages/BusinessRegistrationPage';
import { EmailHelper } from './EmailHelper';
import { uniqueEmail, uniqueTaxCode, nextPhone } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * BusinessFlowHelper — საერთო ბიზნეს რეგისტრაცია (Tppay Wallet & Nuvei POS-ისთვის).
 * რეგისტრაცია ერთნაირია; განსხვავება — რეგისტრაციის მერე Wallet vs POS არჩევა.
 */
export class BusinessFlowHelper {
  private login: LoginPage;
  private otp: OtpPage;
  private accountType: AccountTypePage;
  private business: BusinessRegistrationPage;

  userId: string | null = null;
  /** რეგისტრაციისას გამოყენებული email (PEC-ისთვის) */
  email: string | null = null;
  /** Tppay ვერიფიკაციის სტატუსი (liveness-ზე → LIVENESS_PENDING) */
  tppayStatus: string | null = null;
  /** Nuvei ვერიფიკაციის სტატუსი (Bank account-ის მერე → IN_PROGRESS) */
  nuveiStatus: string | null = null;

  constructor(private page: Page) {
    this.login = new LoginPage(page);
    this.otp = new OtpPage(page);
    this.accountType = new AccountTypePage(page);
    this.business = new BusinessRegistrationPage(page);

    page.on('response', async (res) => {
      if (res.url().includes('/api/v1/profile/details') && res.ok()) {
        try {
          const body = await res.json();
          const val = body?.value ?? body;
          if (val?.userId) this.userId = val.userId;
          if (val?.verificationInfo?.tppay?.status) this.tppayStatus = val.verificationInfo.tppay.status;
          const nuvei = val?.verificationInfo?.nuvei?.status ?? val?.nuvei?.status;
          if (nuvei) this.nuveiStatus = nuvei;
        } catch {
          /* ignore */
        }
      }
    });
  }

  /**
   * საერთო ბიზნეს რეგისტრაცია: login → OTP → Business → ფორმა →
   * email verify (Gmail OTP) → Continue. (Wallet/POS არჩევამდე.)
   */
  async registerBusiness(phone: string = nextPhone()) {
    await this.login.open();
    await this.login.login(phone);
    await this.otp.waitForScreen();
    await this.otp.enterCode(TEST_DATA.otp);

    await this.accountType.chooseBusiness();
    await this.business.clickContinue();

    // უნიკალური email (d.kartozia+N@keepz.me) + tax code
    const email = uniqueEmail('d.kartozia', 'keepz.me');
    this.email = email;
    console.log('📧 email:', email);
    await this.business.fillRegistration({
      companyName: TEST_DATA.business.companyName,
      signerName: TEST_DATA.business.signerName,
      signerSurname: TEST_DATA.business.signerSurname,
      companyTaxCode: uniqueTaxCode(),
      email,
      password: TEST_DATA.business.password,
    });
    await this.business.acceptTerms();

    // Verify → email OTP Gmail-იდან → OK → Continue
    const sentAt = Date.now();
    await this.business.clickVerify();
    const emailHelper = new EmailHelper(
      process.env.GMAIL_USER || TEST_DATA.kyc.email,
      process.env.GMAIL_APP_PASSWORD || ''
    );
    const code = await emailHelper.getVerificationCode(60, 'noreply@keepz.it', sentAt - 10000);
    console.log('📧 email OTP:', code);

    await this.otp.enterCode(code);
    await this.business.confirmOtpSuccess();
    await this.business.clickContinue();
  }

  /**
   * Yousign ხელმოწერა (საერთო Wallet & POS-ისთვის).
   * Sign → Inizia → scroll → Continua → signature OTP (email) → OTP ჩაწერა →
   * Clicca per firmare. ბოლოს this.page ბრუნდება არჩევანის გვერდზე (Wallet/POS).
   */
  async signAgreement() {
    const page = this.page;
    // Sign — ხან ახალ ტაბში, ხან იმავეში
    const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
    await page.getByRole('button', { name: 'Sign' }).click();
    const popup = await popupPromise;
    const sp = popup ?? page;
    await sp.waitForLoadState();

    await sp.getByRole('button', { name: 'Inizia' }).click();
    for (let i = 0; i < 8; i++) {
      await sp.mouse.wheel(0, 1200);
      await sp.waitForTimeout(300);
    }

    // Continua → signature OTP (email: FIRMA ELETTRONICA)
    const sentAt = Date.now();
    await sp.getByRole('button', { name: 'Continua' }).click();
    const emailHelper = new EmailHelper(
      process.env.GMAIL_USER || TEST_DATA.kyc.email,
      process.env.GMAIL_APP_PASSWORD || ''
    );
    const sigOtp = await emailHelper.getVerificationCode(60, '', sentAt - 10000);
    console.log('✍️ signature OTP:', sigOtp);

    await sp.getByRole('textbox', { name: /Inserisci il codice/i }).fill(sigOtp);
    await sp.getByRole('button', { name: 'Clicca per firmare' }).click();

    // არჩევანის გვერდზე დაბრუნება (main page)
    await page.waitForLoadState();
  }
}