import { APIRequestContext, expect } from '@playwright/test';
import { MailinatorHelper } from './MailinatorHelper';

/**
 * MerchantApi — მერჩანტის (LR) walletportal login + TPPay ანგარიშები (KI-432).
 * Login flow: exists → pre-login → validate-and-send-otp → web-resend-otp/fallback (OTP email-ზე)
 *             → OTP mailinator-იდან → web-login → accessToken.
 * credentials .env-იდან: WALLETPORTAL_BASE_URL, MERCHANT_*.
 */
export type Account = 'PERSONAL' | 'TECHNICAL';

export interface Transfer {
  transferId: number;
  status: string;
  otpRequired: boolean;
}

export class MerchantApi {
  private portalUrl = process.env.WALLETPORTAL_BASE_URL || 'https://walletportal.dev.keepz.it';
  private gatewayUrl = 'https://gateway.dev.keepz.it/payment-service/api/tppay';
  private countryCode = process.env.MERCHANT_COUNTRY_CODE || '39';
  private mobile = process.env.MERCHANT_MOBILE || '';
  private password = process.env.MERCHANT_PASSWORD || '';
  private mail = new MailinatorHelper(process.env.MERCHANT_MAILINATOR_INBOX || '');
  private userType = 'BUSINESS';
  private token: string | null = null;

  constructor(private request: APIRequestContext) {}

  /** POST/GET + status check → response.value */
  private async call(method: 'GET' | 'POST', url: string, data?: object, headers = {}) {
    const response = await this.request.fetch(url, { method, data, headers });
    const body = await response.json().catch(() => ({}));
    expect(response.ok(), `${method} ${url} → ${response.status()}: ${body?.message}`).toBeTruthy();
    return body?.value ?? body;
  }

  /** სრული login → Bearer accessToken (ინახება instance-ში) */
  async login(): Promise<string> {
    const base = `${this.portalUrl}/api/v1/auth`;

    const exists = await this.call('GET', `${base}/exists?countryCode=${this.countryCode}&mobile=${this.mobile}`);
    expect(exists.exists, `user ${this.countryCode}${this.mobile} does not exist`).toBeTruthy();

    const { sessionToken } = await this.call('POST', `${base}/pre-login`, {
      countryCode: this.countryCode,
      mobileNumber: this.mobile,
      password: this.password,
    });
    await this.call('POST', `${base}/validate-and-send-otp`, { sessionToken, userType: this.userType });

    const sentAt = Date.now() - 5000;
    await this.call('POST', `${base}/web-resend-otp/fallback`, { sessionToken });
    const otp = await this.mail.getVerificationCode(120, sentAt);

    // body — ზუსტად ბრაუზერის web-login-ის მსგავსად
    const { accessToken } = await this.call('POST', `${base}/web-login`, {
      countryCode: this.countryCode,
      deviceToken: null,
      mobileNumber: this.mobile,
      otp,
      sessionToken,
      userType: this.userType,
    });
    this.token = accessToken;
    return accessToken;
  }

  private async auth() {
    if (!this.token) await this.login();
    return { Authorization: `Bearer ${this.token}` };
  }

  /** ორივე ანგარიშის available ბალანსი */
  async balances(): Promise<Record<Account, number>> {
    const list = await this.call('GET', `${this.gatewayUrl}/account/balance`, undefined, await this.auth());
    const byAccount = Object.fromEntries(list.map((a: any) => [a.account, Number(a.available)]));
    return byAccount as Record<Account, number>;
  }

  /** PERSONAL → TECHNICAL: CHALLENGE (OTP საჭიროა) */
  async personalToTechnical(amount: number): Promise<Transfer> {
    return this.call('POST', `${this.gatewayUrl}/account/internal-transfer/personal-to-technical`, { amount }, await this.auth());
  }

  /** OTP-ის ხელახლა გაგზავნა email-ზე (SMS კოდი უქმდება) */
  async resendOtp(transferId: number): Promise<Transfer> {
    return this.call('POST', `${this.gatewayUrl}/account/internal-transfer/${transferId}/resend-otp`, undefined, await this.auth());
  }

  async verifyOtp(transferId: number, otp: string): Promise<Transfer> {
    return this.call('POST', `${this.gatewayUrl}/account/internal-transfer/${transferId}/verify-otp`, { otp }, await this.auth());
  }

  /** TECHNICAL → PERSONAL: ერთი request, OTP-ის გარეშე */
  async technicalToPersonal(amount: number): Promise<Transfer> {
    return this.call('POST', `${this.gatewayUrl}/account/internal-transfer/technical-to-personal`, { amount }, await this.auth());
  }

  /** Cash In / Cash Out — gaming company picker (უკვე გაფილტრულია ამ მერჩანტისთვის, KI-398) */
  async gamingCompanies(): Promise<{ id: string; name: string }[]> {
    return this.call('GET', `${this.portalUrl}/api/tppay-admin/gaming-companies`, undefined, await this.auth());
  }

  /** OTP mailinator-იდან — მხოლოდ afterMs-ის შემდეგ მოსული */
  async otpFromEmail(afterMs: number): Promise<string> {
    return this.mail.getVerificationCode(60, afterMs);
  }

  /**
   * PERSONAL → TECHNICAL სრული flow + ასერტები:
   * CHALLENGE → resend (email) → OTP mailinator-იდან → verify-otp → EXEC → ბალანსი ±amount (საკომისიო 0.00)
   */
  async transferPersonalToTechnical(amount = 1.0) {
    const before = await this.balances();

    const transfer = await this.personalToTechnical(amount);
    expect(transfer.status).toBe('CHALLENGE');
    expect(transfer.otpRequired).toBe(true);

    const sentAt = Date.now() - 5000;
    await this.resendOtp(transfer.transferId);
    const otp = await this.otpFromEmail(sentAt);

    const result = await this.verifyOtp(transfer.transferId, otp);
    expect(result.status).toBe('EXEC');
    expect(result.otpRequired).toBe(false);

    const after = await this.balances();
    expect(after.PERSONAL).toBeCloseTo(before.PERSONAL - amount, 2);
    expect(after.TECHNICAL).toBeCloseTo(before.TECHNICAL + amount, 2);
    console.log(`✅ PERSONAL → TECHNICAL ${amount} (OTP) — P ${after.PERSONAL} / T ${after.TECHNICAL}`);
  }

  /** TECHNICAL → PERSONAL სრული flow + ასერტები: ერთი request → EXEC (OTP-ის გარეშე) → ბალანსი ±amount */
  async transferTechnicalToPersonal(amount = 1.0) {
    const before = await this.balances();

    const result = await this.technicalToPersonal(amount);
    expect(result.status).toBe('EXEC');
    expect(result.otpRequired).toBe(false);

    const after = await this.balances();
    expect(after.TECHNICAL).toBeCloseTo(before.TECHNICAL - amount, 2);
    expect(after.PERSONAL).toBeCloseTo(before.PERSONAL + amount, 2);
    console.log(`✅ TECHNICAL → PERSONAL ${amount} (no OTP) — P ${after.PERSONAL} / T ${after.TECHNICAL}`);
  }
}
