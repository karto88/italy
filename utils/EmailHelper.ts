import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

/**
 * EmailHelper — Gmail IMAP-იდან KYC email verification კოდის წაკითხვა.
 * მეილი: from noreply@keepz.it, subject "Thanks for adding your email!"
 *        body: "...email verification code:515585"
 */
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
    afterMs = Date.now() - 60000
  ): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const connection = await imaps.connect(this.config);
        await connection.openBox('INBOX');

        const oneMinuteAgo = new Date(Date.now() - 60000);
        const searchCriteria = [['SINCE', oneMinuteAgo]];
        const fetchOptions = { bodies: [''], markSeen: true };

        const messages = await connection.search(searchCriteria, fetchOptions);

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