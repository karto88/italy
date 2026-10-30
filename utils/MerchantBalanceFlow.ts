import { expect } from '@playwright/test';
import { AccountStatementPage } from '../pages/AccountStatementPage';
import { MailinatorHelper } from './MailinatorHelper';

const round = (n: number) => Math.round(n * 100) / 100;

type Balances = { Business: number; Operating: number; total: number };

/** 💶 ბალანსის ლოგი რეპორტისთვის (Business = Personal, Operating = Technical) */
function log(label: string, b: Balances) {
  console.log(`💶 ${label}: Personal €${b.Business.toFixed(2)} · Technical €${b.Operating.toFixed(2)} · total €${b.total.toFixed(2)}`);
}

/**
 * MerchantBalanceFlow — "Transfer between accounts" (KI-432) ქეისები, web portal.
 *   Business (PERSONAL) → Operating (TECHNICAL): SMS OTP → "Send a new code (by email)" → mailinator
 *   Operating → Business: OTP-ის გარეშე ("Check and confirm")
 * ყოველი ქეისი: ბალანსი ტრანსფერამდე → მოქმედება → ბალანსი შემდეგ (რამდენი იყო / რამდენია).
 * tests/Update-merchant-balance/* მხოლოდ ამ ფუნქციებს იძახებს.
 */
export class MerchantBalanceFlow {
  constructor(private statement: AccountStatementPage, private mail: MailinatorHelper) {}

  /** ბალანსი შემდეგ = ტრანსფერამდე (ფული არ გადავიდა) */
  private async expectUnchanged(before: Balances) {
    const after = await this.statement.balances();
    log('after ', after);
    expect(after).toEqual(before);
    console.log('✅ balances unchanged');
  }

  /** from −amount, to +amount, total იგივე */
  private async expectMoved(before: Balances, from: 'Business' | 'Operating', to: 'Business' | 'Operating', amount: string) {
    const after = await this.statement.balances();
    log('after ', after);
    expect(after[from]).toBe(round(before[from] - Number(amount)));
    expect(after[to]).toBe(round(before[to] + Number(amount)));
    expect(after.total).toBe(before.total);
    const name = (a: string) => (a === 'Business' ? 'Personal' : 'Technical');
    console.log(`✅ ${name(from)} −€${amount}, ${name(to)} +€${amount}, total unchanged`);
  }

  // ---------- positive ----------

  /** Business → Operating, OTP მეილით: Business −amount, Operating +amount, total იგივე */
  async businessToOperating(amount: string) {
    const before = await this.statement.balances();
    log('before', before);

    await this.statement.openTransfer('Business');
    await this.statement.fillAmount(amount);
    await this.statement.clickContinue();
    await this.statement.expectOtpStep(amount);

    const afterMs = Date.now() - 5000;
    await this.statement.resendByEmail();
    await this.statement.enterOtp(await this.mail.getVerificationCode(120, afterMs));
    await this.statement.expectCompleted(amount, 'Operating');

    await this.expectMoved(before, 'Business', 'Operating', amount);
  }

  /** Operating → Business, OTP-ის გარეშე: Operating −amount, Business +amount, total იგივე */
  async operatingToBusiness(amount: string) {
    const before = await this.statement.balances();
    log('before', before);

    await this.statement.openTransfer('Operating');
    await this.statement.fillAmount(amount);
    await this.statement.clickContinue();
    await this.statement.expectConfirmStep(amount);
    await this.statement.confirmTransfer();
    await this.statement.expectCompleted(amount, 'Business');

    await this.expectMoved(before, 'Operating', 'Business', amount);
  }

  /** Whole balance ავსებს მთლიან ხელმისაწვდომ თანხას (Operating) → Back, ფული არ გადადის */
  async wholeBalance() {
    const before = await this.statement.balances();
    log('before', before);

    await this.statement.openTransfer('Operating');
    await this.statement.wholeBalance();
    expect(Number((await this.statement.amountValue()).replace(',', '.'))).toBe(before.Operating);
    await this.statement.clickContinue();
    await this.statement.expectConfirmStep(before.Operating.toFixed(2));
    await this.statement.back();
    await this.statement.cancel();

    await this.expectUnchanged(before);
  }

  // ---------- negative ----------

  /** თანხა → Continue → ფორმის შეცდომა, ბალანსი უცვლელი. message-ში {max} = From ანგარიშის ბალანსი */
  async invalidAmount(from: 'Business' | 'Operating', amount: string | ((available: number) => string), message: string) {
    const before = await this.statement.balances();
    log('before', before);
    const available = before[from];

    await this.statement.openTransfer(from);
    await this.statement.fillAmount(typeof amount === 'function' ? amount(available) : amount);
    await this.statement.clickContinue();
    await this.statement.expectFormError(message.replace('{max}', `€${available.toFixed(2)}`));
    await this.statement.cancel();

    await this.expectUnchanged(before);
  }

  /** ბალანსზე მეტი თანხა → "Not enough funds…" */
  async moreThanAvailable(from: 'Business' | 'Operating') {
    await this.invalidAmount(
      from,
      (available) => String(available + 1000),
      `Not enough funds in the ${from.toLowerCase()} account: you can transfer up to {max}.`
    );
  }

  /** ასოები თანხის ველში არ იწერება */
  async lettersNotAccepted() {
    await this.statement.open();
    await this.statement.openTransfer('Business');
    await this.statement.typeAmount('abc');
    expect(await this.statement.amountValue()).toBe('');
    await this.statement.cancel();
  }

  /** Continue → OTP / Check and confirm ეკრანზე Back → ფული არ გადადის */
  async backBeforeConfirm(from: 'Business' | 'Operating') {
    const before = await this.statement.balances();
    log('before', before);

    await this.statement.openTransfer(from);
    await this.statement.fillAmount('1.00');
    await this.statement.clickContinue();
    if (from === 'Business') await this.statement.expectOtpStep('1.00');
    else await this.statement.expectConfirmStep('1.00');
    await this.statement.back();
    await this.statement.cancel();

    await this.expectUnchanged(before);
  }

  /** არასწორი SMS OTP → "An error occurred", ფული არ გადადის */
  async wrongOtp() {
    const before = await this.statement.balances();
    log('before', before);

    await this.statement.openTransfer('Business');
    await this.statement.fillAmount('1.00');
    await this.statement.clickContinue();
    await this.statement.enterOtp('111111');
    await this.statement.expectErrorPopup('An error occurred');

    await this.expectUnchanged(before);
  }

  /**
   * KI-472: არასწორი SMS OTP-ის შემდეგ ტრანსფერი ჩავარდნილია → ფრონტმა თავიდან უნდა დაიწყოს.
   * ახლა OTP ეკრანი რჩება, resend 2272 "Provider error"-ს აბრუნებს.
   */
  async wrongOtpRestartsTransfer() {
    await this.statement.open();
    await this.statement.openTransfer('Business');
    await this.statement.fillAmount('1.00');
    await this.statement.clickContinue();
    await this.statement.enterOtp('111111');
    await this.statement.expectErrorPopup('An error occurred');

    await expect(this.statement.resendEmailButton).toBeHidden();
    await this.statement.expectAmountForm();
  }
}
