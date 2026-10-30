import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

/**
 * EmailHelper — Gmail IMAP-იდან KYC email verification კოდის წაკითხვა.
 * მეილი: from noreply@keepz.it, subject "Thanks for adding your email!"
 *        body: "...email verification code:515585"
 */
/** promise → reject, თუ ms-ში არ დასრულდა */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`IMAP timeout ${ms}ms`)), ms)),
  ]);
}

export class EmailHelper {
  private config: any;

  constructor(email: string, appPassword: string) {
    this.config = {
      imap: {
        user: email,
        password: (appPassword || '').replace(/\s+/g, ''),
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
        connTimeout: 15000,
      },
    };
  }

  /**
   * ახლახან მოსული email verification კოდის წაკითხვა.
   * @param timeoutSeconds რამდენ ხანს ველოდოთ მეილს
   * @param fromEmail გამომგზავნი (default noreply@keepz.it)
   */
  async getVerificationCode(
    timeoutSeconds = 30,
    fromEmail = 'noreply@keepz.it',
    afterMs = Date.now() - 60000,
    toEmail?: string // მხოლოდ ამ მისამართზე მოსული მეილი (plus-addressing — სხვა 6-ციფრიანი მეილები რომ არ აირიოს)
  ): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        // connect/search ზოგჯერ უსასრულოდ ეკიდება (Gmail IMAP) — თითო ცდა 20წმ-ით შემოვფარგლოთ
        const connection: any = await withTimeout(imaps.connect(this.config), 20000);
        await withTimeout(connection.openBox('INBOX'), 20000);

        const oneMinuteAgo = new Date(Date.now() - 60000);
        const searchCriteria = [['SINCE', oneMinuteAgo]];
        const fetchOptions = { bodies: [''], markSeen: true };

        const messages: any[] = await withTimeout(connection.search(searchCriteria, fetchOptions), 20000);

        // უახლესიდან უძველესისკენ
        for (const msg of messages.reverse()) {
          const all = msg.parts.find((p: any) => p.which === '');
          if (!all) continue;

          const parsed = await simpleParser(all.body);
          const from = parsed.from?.text || '';
          const body = parsed.text || parsed.html || '';
          const date = parsed.date ? parsed.date.getTime() : 0;

          if (fromEmail && !from.toLowerCase().includes(fromEmail.toLowerCase())) continue;
          if (date < afterMs) continue; // მხოლოდ send-ის შემდეგ მოსული (ძველი OTP-ს ავცდეთ)
          const to = [parsed.to].flat().map((t: any) => t?.text || '').join(' ').toLowerCase();
          if (toEmail && !to.includes(toEmail.toLowerCase())) continue;

          // "verification code:515585" | "FIRMA ELETTRONICA: 908357" | fallback 6-digit
          let match =
            body.match(/verification code:\s*(\d{4,8})/i) ||
            body.match(/FIRMA ELETTRONICA:\s*(\d{4,8})/i) ||
            body.match(/codice di sicurezza[^0-9]*(\d{4,8})/i) ||
            body.match(/\b(\d{6})\b/);

          if (match) {
            await connection.end();
            return match[1];
          }
        }

        await connection.end();
        await new Promise((r) => setTimeout(r, 2000));
      } catch (error: any) {
        if ((error.message || '').includes('Invalid credentials')) {
          throw new Error('Gmail auth failed — შეამოწმე GMAIL_USER / GMAIL_APP_PASSWORD .env-ში');
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    throw new Error('Email verification code not found in time');
  }
}