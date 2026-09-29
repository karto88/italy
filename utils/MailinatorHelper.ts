/**
 * MailinatorHelper — mailinator public inbox-იდან OTP/verification კოდის წაკითხვა (HTTP API, auth არ სჭირდება).
 * გამოსადეგია საზიარო ტესტ-ექაუნთებისთვის (მაგ. keepztest01@mailinator.com), როცა
 * პირადი Gmail-ის მაგივრად სხვისთვის გადასაცემი credential-ები გვჭირდება.
 */
export class MailinatorHelper {
  /** @param inbox mailinator inbox-ის სახელი (@-ის წინ) ან სრული email — ორივე მუშაობს */
  constructor(private inbox: string) {
    this.inbox = inbox.split('@')[0];
  }

  /**
   * ახლახან მოსული verification/OTP კოდის წაკითხვა.
   * @param timeoutSeconds რამდენ ხანს ველოდოთ მეილს
   * @param afterMs მხოლოდ ამის შემდეგ მოსული მეილი (ძველი OTP-ს ასაცილებლად)
   */
  async getVerificationCode(timeoutSeconds = 60, afterMs = Date.now() - 60000): Promise<string> {
    const startTime = Date.now();
    let pollMs = 3000; // Cloudflare (mailinator public API) rate-limits tight polling — back off on errors

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      try {
        const listRes = await fetch(
          `https://www.mailinator.com/api/v2/domains/public/inboxes/${this.inbox}`,
          { headers: HEADERS }
        );
        const list = await listRes.json();
        const msgs = (list.msgs || [])
          .filter((m: any) => (m.time ?? 0) >= afterMs)
          .sort((a: any, b: any) => (b.time ?? 0) - (a.time ?? 0));

        for (const m of msgs) {
          const msgRes = await fetch(
            `https://www.mailinator.com/api/v2/domains/public/messages/${m.id}`,
            { headers: HEADERS }
          );
          const msg = await msgRes.json();
          const text = flattenText(msg);

          const match =
            text.match(/verification code:\s*(\d{4,8})/i) ||
            text.match(/FIRMA ELETTRONICA:\s*(\d{4,8})/i) ||
            text.match(/codice di sicurezza[^0-9]*(\d{4,8})/i) ||
            text.match(/\b(\d{6})\b/);

          if (match) return match[1];
        }
        pollMs = 3000; // success — reset backoff
      } catch {
        pollMs = Math.min(pollMs * 1.5, 10000); // rate-limited/network hiccup — slow down
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }

    throw new Error(`Mailinator: verification code not found in time (inbox: ${this.inbox})`);
  }
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/** JSON response-ის ყველა string მნიშვნელობის ერთ ტექსტად ჩაკრება (schema-სგან დამოუკიდებელი ძებნისთვის) */
function flattenText(obj: any, depth = 0): string {
  if (depth > 6 || obj == null) return '';
  if (typeof obj === 'string') return obj + ' ';
  if (typeof obj !== 'object') return '';
  let out = '';
  for (const key of Object.keys(obj)) out += flattenText(obj[key], depth + 1);
  return out;
}
