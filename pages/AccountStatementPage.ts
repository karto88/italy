import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type Account = 'Business' | 'Operating';

/**
 * AccountStatementPage — "Accounts & transactions" (/account-statement), მერჩანტის portal.
 * Business account = PERSONAL (B), Operating account = TECHNICAL (C).
 * "Transfer between accounts" modal: Business → Operating (SMS OTP) / Operating → Business (OTP-ის გარეშე).
 */
export class AccountStatementPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get amountInput() {
    return this.page.locator('#internal-transfer-amount');
  }
  private get continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }
  get resendEmailButton() {
    return this.page.getByRole('button', { name: 'Send a new code (by email)' });
  }

  async open() {
    await this.goto('/account-statement');
    await this.page.getByRole('heading', { name: 'Accounts & transactions' }).waitFor();
  }

  /** "€1,234.56" → 1234.56 */
  static parse(text: string): number {
    return Number(text.replace(/[^\d.,]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  }

  /** Total balance (გვერდის თავში) */
  async totalBalance(): Promise<number> {
    const value = this.page.getByText('Total balance', { exact: true }).locator('xpath=following-sibling::*[1]');
    return AccountStatementPage.parse(await value.innerText());
  }

  /** Transfer modal-ის გახსნა (default მიმართულება: Business → Operating) */
  async openTransfer(from: Account = 'Business') {
    await this.page.getByRole('button', { name: 'Transfer between accounts' }).first().click();
    await this.amountInput.waitFor();
    if ((await this.fromAccount()) !== from) await this.swap();
  }

  async swap() {
    await this.page.getByRole('button', { name: 'Swap direction' }).click();
  }

  /** modal-ის From ბარათის ანგარიში */
  async fromAccount(): Promise<Account> {
    const cards = await this.availableCards();
    return cards[0].account;
  }

  /** modal-ის From/To ბარათები: [{ account, available }] — From პირველია */
  private async availableCards(): Promise<{ account: Account; available: number }[]> {
    const items = this.page.getByText(/^Available: €/);
    await expect(items).toHaveCount(2);
    return items.evaluateAll((els) =>
      els.map((e) => ({
        account: (e.parentElement?.textContent || '').includes('Business') ? 'Business' : 'Operating',
        text: e.textContent || '',
      }))
    ).then((rows) => rows.map((r) => ({ account: r.account as Account, available: AccountStatementPage.parse(r.text) })));
  }

  /** ორივე ანგარიშის ხელმისაწვდომი ბალანსი (modal-იდან) + Total balance */
  async balances(): Promise<{ Business: number; Operating: number; total: number }> {
    await this.open();
    const total = await this.totalBalance();
    await this.openTransfer();
    const cards = await this.availableCards();
    await this.cancel();
    const get = (a: Account) => cards.find((c) => c.account === a)!.available;
    return { Business: get('Business'), Operating: get('Operating'), total };
  }

  async fillAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  /** კლავიატურით აკრეფა (ფილტრის შესამოწმებლად — fill-ი ფილტრს გვერდს უვლის) */
  async typeAmount(text: string) {
    await this.amountInput.pressSequentially(text);
  }

  /** ტრანსფერის საწყისი ფორმა (თანხის ველი) ჩანს */
  async expectAmountForm() {
    await expect(this.amountInput).toBeVisible();
  }

  async amountValue() {
    return this.amountInput.inputValue();
  }

  async wholeBalance() {
    await this.page.getByText('Whole balance', { exact: true }).click();
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
    await this.amountInput.waitFor({ state: 'hidden' });
  }

  async back() {
    await this.page.getByRole('button', { name: 'Back' }).click();
  }

  /** ფორმის ვალიდაციის შეტყობინება */
  async expectFormError(message: string) {
    const actual = this.page.locator('.MuiFormHelperText-root.Mui-error').first();
    await expect(actual).toBeVisible();
    const text = (await actual.innerText()).trim();
    console.log(`🧾 expected error: "${message}"`);
    console.log(`🧾 actual error:   "${text}" ${text === message ? '✅ matches' : '❌ different'}`);
    expect(text).toBe(message);
  }

  /** შეჯამების "Amount" ხაზის მნიშვნელობა (OTP / Check and confirm ეკრანზე) */
  private summaryAmount() {
    return this.page.getByText('Amount', { exact: true }).last().locator('xpath=following-sibling::*[1]');
  }

  // --- Business → Operating: OTP ---
  async expectOtpStep(amount: string) {
    await expect(this.page.getByRole('heading', { name: 'Enter the code' })).toBeVisible();
    await expect(this.page.getByText('We sent a 6-digit code by SMS to your registered mobile.')).toBeVisible();
    await expect(this.summaryAmount()).toHaveText(`€${amount}`);
    await expect(this.page.getByRole('button', { name: 'Confirm', exact: true })).toBeDisabled();
  }

  async resendByEmail() {
    await this.resendEmailButton.click();
    await expect(this.page.getByText('We sent a new code by email. The SMS code is no longer valid.')).toBeVisible();
    await expect(this.resendEmailButton).toBeDisabled();
  }

  async enterOtp(code: string) {
    await this.page.getByRole('textbox', { name: 'SMS code' }).fill(code);
    await this.page.getByRole('button', { name: 'Confirm', exact: true }).click();
  }

  // --- Operating → Business: OTP-ის გარეშე ---
  async expectConfirmStep(amount: string) {
    await expect(this.page.getByRole('heading', { name: 'Check and confirm' })).toBeVisible();
    await expect(this.page.getByText('No code needed: check the summary before confirming.')).toBeVisible();
    await expect(this.summaryAmount()).toHaveText(`€${amount}`);
  }

  async confirmTransfer() {
    await this.page.getByRole('button', { name: 'Confirm transfer' }).click();
  }

  /** "Transfer completed" ეკრანი → Done */
  async expectCompleted(amount: string, to: Account) {
    await expect(this.page.getByRole('heading', { name: 'Transfer completed' })).toBeVisible({ timeout: 30000 });
    await expect(
      this.page.getByText(`€${amount} is now in the ${to.toLowerCase()} account. Balances are already updated.`)
    ).toBeVisible();
    await this.page.getByRole('button', { name: 'Done' }).click();
  }

  /** error popup ("An error occurred" / "Provider error") → OK */
  async expectErrorPopup(title: string) {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible({ timeout: 30000 });
    await this.page.getByRole('button', { name: 'OK' }).click();
  }
}
