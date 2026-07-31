import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * OtpPage — SMS კოდის შეყვანა (6-ციფრიანი, 6 ცალკე უჯრა)
 * URL: /otp
 * თითო უჯრა = spinbutton, სახელით 'Please enter OTP character N'
 */
export class OtpPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** N-ური OTP უჯრა (1-იდან) */
  private otpBox(index: number) {
    return this.page.getByRole('spinbutton', {
      name: `Please enter OTP character ${index}`,
    });
  }

  private get title() {
    return this.page.getByRole('heading', { name: /6 digit SMS code/i });
  }

  private get resendButton() {
    return this.page.getByRole('button', { name: /resend code/i });
  }

  /** დაელოდე OTP ეკრანს — პირველი უჯრის გამოჩენას */
  async waitForScreen() {
    await this.otpBox(1).waitFor({ state: 'visible' });
  }

  /**
   * კოდის შეყვანა — თითო ციფრი თითო უჯრაში.
   * @param code 6-ციფრიანი კოდი (default '111111' — სტატიკური სატესტო კოდი)
   */
  async enterCode(code: string = '111111') {
    for (let i = 0; i < code.length; i++) {
      const box = this.otpBox(i + 1);
      await box.click();
      // React OTP — რეალური keyboard press (fill ხშირად onChange-ს არ triggers)
      await this.page.keyboard.press(code[i]);
    }
  }

  /** კოდის თავიდან გამოგზავნა */
  async resend() {
    await this.resendButton.click();
  }
}