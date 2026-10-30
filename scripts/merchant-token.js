/**
 * merchant-token — მერჩანტის (LR) walletportal login → Bearer accessToken.
 * Flow: exists → pre-login → validate-and-send-otp → web-resend-otp/fallback (OTP email-ზე)
 *       → OTP mailinator-იდან → web-login → accessToken (+ pbcopy clipboard-ში).
 * credentials .env-იდან: WALLETPORTAL_BASE_URL, MERCHANT_*.
 *
 * გაშვება: npm run merchant:token
 */
require('dotenv').config({ quiet: true });
const { execSync } = require('child_process');

const BASE = process.env.WALLETPORTAL_BASE_URL || 'https://walletportal.dev.keepz.it';
const COUNTRY = process.env.MERCHANT_COUNTRY_CODE || '39';
const MOBILE = process.env.MERCHANT_MOBILE;
const PASSWORD = process.env.MERCHANT_PASSWORD;
const INBOX = (process.env.MERCHANT_MAILINATOR_INBOX || '').split('@')[0];

const MAILINATOR_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${data.message || text}`);
  return data.value ?? data;
}

/** TPPay OTP mailinator-იდან — subject: "361404 codice conferma operazione" */
async function otpFromMailinator(afterMs, timeoutSeconds = 120) {
  const start = Date.now();
  // mailinator: ~10 სწრაფი request-ის შემდეგ 429 — იშვიათად ვამოწმებთ, 429-ზე 30წმ ველოდებით
  let pollMs = 5000;
  await new Promise((r) => setTimeout(r, 5000));
  while (Date.now() - start < timeoutSeconds * 1000) {
    try {
      const res = await fetch(`https://www.mailinator.com/api/v2/domains/public/inboxes/${INBOX}`, {
        headers: MAILINATOR_HEADERS,
      });
      if (res.status === 429) {
        console.log('⏳ mailinator 429 (rate limit) — waiting 30s');
        await new Promise((r) => setTimeout(r, 30000));
        continue;
      }
      const msgs = ((await res.json()).msgs || [])
        .filter((m) => (m.time ?? 0) >= afterMs)
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
      const match = msgs.map((m) => (m.subject || '').match(/\b(\d{6})\b/)).find(Boolean);
      if (match) return match[1];
      pollMs = 5000;
    } catch {
      pollMs = Math.min(pollMs * 1.5, 15000);
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`Mailinator: OTP not found in time (inbox: ${INBOX})`);
}

(async () => {
  if (!MOBILE || !PASSWORD || !INBOX) {
    throw new Error('შეავსე MERCHANT_MOBILE / MERCHANT_PASSWORD / MERCHANT_MAILINATOR_INBOX .env-ში');
  }

  const exists = await call('GET', `/api/v1/auth/exists?countryCode=${COUNTRY}&mobile=${MOBILE}`);
  if (!exists.exists) throw new Error(`User ${COUNTRY}${MOBILE} does not exist`);

  const { sessionToken, userTypes } = await call('POST', '/api/v1/auth/pre-login', {
    countryCode: COUNTRY,
    mobileNumber: MOBILE,
    password: PASSWORD,
  });
  const USER_TYPE = process.env.MERCHANT_USER_TYPE || userTypes?.[0]?.type || 'BUSINESS';
  console.log(`👤 ${userTypes?.map((u) => `${u.type} – ${u.name}`).join(', ')} → ${USER_TYPE}`);
  await call('POST', '/api/v1/auth/validate-and-send-otp', { sessionToken, userType: USER_TYPE });

  const sentAt = Date.now() - 5000;
  await call('POST', '/api/v1/auth/web-resend-otp/fallback', { sessionToken });
  console.log(`📧 OTP sent to ${INBOX}@mailinator.com — waiting...`);
  const otp = await otpFromMailinator(sentAt);
  console.log(`🔑 OTP: ${otp}`);

  const { accessToken } = await call('POST', '/api/v1/auth/web-login', {
    countryCode: COUNTRY,
    deviceToken: null,
    mobileNumber: MOBILE,
    otp,
    sessionToken,
    userType: USER_TYPE,
  });

  try {
    execSync('pbcopy', { input: accessToken });
    console.log('📋 accessToken copied to clipboard');
  } catch {
    /* pbcopy მხოლოდ macOS-ზე */
  }
  console.log(`\n${accessToken}\n`);
})().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
