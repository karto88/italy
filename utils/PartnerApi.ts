import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { TEST_DATA } from '../config/portal.config';
import { fiscalCode, nextKeepzitEmail, nextPreloadPhone, randomBirthDate, randomName, uniqueMailinatorEmail } from './randomData';

/**
 * PartnerApi — KeepzWalletService v2 partner API (KI-456, pre-loaded onboarding).
 * auth (client_credentials) → Bearer token → prePopulateKyc / existence/wallet.
 * credentials .env-იდან: PARTNER_V2_BASE, PARTNER_CLIENT_ID, PARTNER_CLIENT_SECRET.
 */
export interface PrePopulateResult {
  fiscalCode: string;
  outcome: 'ACCEPTED' | 'UPDATED' | 'REJECTED';
  errorCode?: string;
  errorMessage?: string;
}

export type DocumentType = 'IDENTITY_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';

/** დოკუმენტის ტიპი + გამცემი ორგანო (KYC UI mapping, KI-175: Comune / Questura / Motorizzazione) */
export interface KycDocument {
  type: DocumentType;
  releaseInstitution: string;
}

export type Individual = ReturnType<PartnerApi['individual']>;

/** ნეგატიური ქეისები (§7.8/§7.10): ინდივიდის ცვლილება → მოსალოდნელი errorCode + ველი errorMessage-ში */
export const INVALID_INDIVIDUAL = {
  fiscalCodeInvalid: { field: 'fiscalCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (x: Individual) => { x.fiscalCode = 'ABC123'; } },
  fiscalCodeBadChecksum: {
    field: 'fiscalCode',
    errorCode: 'INVALID_FIELD_VALUE',
    mutate: (x: Individual) => { x.fiscalCode = x.fiscalCode.slice(0, 15) + (x.fiscalCode[15] === 'A' ? 'B' : 'A'); },
  },
  fiscalCodeEmpty: { field: 'fiscalCode', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (x: Individual) => { x.fiscalCode = ''; } },
  documentTypeInvalid: { field: 'documents[0].type', errorCode: 'INVALID_FIELD_VALUE', mutate: (x: Individual) => { (x.documents[0] as any).type = 'VISA'; } },
  documentTypeEmpty: { field: 'documents[0].type', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (x: Individual) => { (x.documents[0] as any).type = ''; } },
  addressesEmpty: { field: 'addresses', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (x: Individual) => { x.addresses = []; } },
  documentsEmpty: { field: 'documents', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (x: Individual) => { x.documents = []; } },
  releaseInstitutionInvalid: {
    field: 'documents[0].releaseInstitution',
    errorCode: 'INVALID_FIELD_VALUE',
    mutate: (x: Individual) => { x.documents[0].releaseInstitution = 'INVALID_XYZ'; },
  },
  releaseInstitutionEmpty: {
    field: 'documents[0].releaseInstitution',
    errorCode: 'MISSING_MANDATORY_FIELD',
    mutate: (x: Individual) => { x.documents[0].releaseInstitution = ''; },
  },
  mobileEmpty: { field: 'mobile', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (x: Individual) => { x.mobile = ''; } },
  mobileNotItalian: { field: 'mobile', errorCode: 'INVALID_FIELD_VALUE', mutate: (x: Individual) => { x.mobile = '5551234'; } },
  birthProvCodeInvalid: { field: 'birth.provCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (x: Individual) => { x.birth.provCode = 'XX'; } },
  addressProvCodeInvalid: { field: 'addresses[0].provCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (x: Individual) => { x.addresses[0].provCode = 'XX'; } },
};

export type InvalidIndividualCase = keyof typeof INVALID_INDIVIDUAL;

const TEST_PASSWORD = TEST_DATA.password;

export class PartnerApi {
  protected baseUrl = process.env.PARTNER_V2_BASE || 'https://gateway.dev.keepz.it/payment-service/api/v2';
  protected clientId = process.env.PARTNER_CLIENT_ID || '';
  private clientSecret = process.env.PARTNER_CLIENT_SECRET || '';
  private token: string | null = null;

  constructor(protected request: APIRequestContext) {}

  /** POST + status check → JSON body */
  protected async post(path: string, data: object, auth = true) {
    const headers = auth ? { Authorization: `Bearer ${await this.auth()}` } : {};
    const response = await this.request.post(`${this.baseUrl}${path}`, { data, headers });
    const body = await response.json().catch(() => ({}));
    expect(response.ok(), `POST ${path} → ${response.status()}: ${body?.code ?? ''} ${body?.message ?? ''}`).toBeTruthy();
    return body;
  }

  /** POST status check-ის გარეშე (ნეგატიური ქეისებისთვის) → { status, body } */
  protected async rawPost(path: string, data: object, token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await this.request.post(`${this.baseUrl}${path}`, { data, headers });
    return { status: response.status(), body: await response.json().catch(() => ({})) };
  }

  /** ერორის envelope (§7.11): HTTP status + statusCode + code + requestId უცვლელად */
  protected expectError(res: { status: number; body: any }, status: number, code: string, requestId: string) {
    console.log(`${status}/${code} → ${res.status} ${JSON.stringify(res.body)}`);
    expect(res.status, res.body?.message).toBe(status);
    expect(res.body.statusCode).toBe(status);
    expect(res.body.code).toBe(code);
    expect(res.body.message, 'error message missing').toBeTruthy();
    expect(res.body.requestId).toBe(requestId);
  }

  /** §7.1 auth → access_token (ინახება instance-ში, 1 სთ) */
  async auth(): Promise<string> {
    if (this.token) return this.token;
    const body = await this.post(
      '/operations/external/auth',
      {
        requestId: randomUUID(),
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
      false
    );
    expect(body.access_token, 'auth → no access_token').toBeTruthy();
    this.token = body.access_token;
    return body.access_token;
  }

  /**
   * ერთი ინდივიდის მონაცემი (§7.8):
   * დაბადება 2000-მდე (1970–1999), ვალიდური CF (მაგ. RSSMRA87M22H501Z), იტალიური 10-ციფრიანი მობილური (3XXXXXXXXX).
   */
  individual(document: KycDocument = { type: 'IDENTITY_CARD', releaseInstitution: 'MUNICIPALITY' }) {
    const { firstName, lastName } = randomName();
    const birthDate = randomBirthDate();
    const gender = firstName.endsWith('a') && !['Andrea', 'Luca', 'Nicola', 'Mattia'].includes(firstName) ? 'F' : 'M';
    return {
      fiscalCode: fiscalCode(firstName, lastName, birthDate, gender),
      name: firstName,
      surname: lastName,
      gender,
      birth: { date: birthDate, cityName: 'Roma', provCode: 'RM', countryCode: 'ITA' },
      citizenship: { code: 'ITA', name: 'Italia' },
      addresses: [
        { type: 'RESIDENCE', street: 'Via Roma', number: '1', zipCode: '00100', cityName: 'Roma', provCode: 'RM', countryCode: 'ITA' },
      ],
      documents: [
        {
          type: document.type,
          number: 'CA' + String(Date.now()).slice(-7),
          releaseInstitution: document.releaseInstitution,
          releaseCity: 'Roma',
          releaseDate: '2022-01-15',
          expiryDate: '2032-01-15',
        },
      ],
      email: uniqueMailinatorEmail(),
      mobilePrefix: '+39',
      mobile: '3' + String(Date.now()).slice(-9),
      identifiedAt: new Date().toISOString(),
      gameAccount: { idGamePlatform: 1, gameAccountId: 'GA-' + String(Date.now()).slice(-6), status: 'ACTIVE' },
    };
  }

  /** §7.8 prePopulateKyc → სრული პასუხი */
  async prePopulateKyc(individuals: object[]) {
    const requestId = randomUUID();
    const body = await this.post('/prePopulateKyc', { requestId, clientId: this.clientId, individuals });
    expect(body.requestId).toBe(requestId);
    expect(body.clientId).toBe(this.clientId);
    return body;
  }

  /** §7.7 existence/wallet → სრული პასუხი */
  async existenceWallet(fiscalCode: string) {
    const requestId = randomUUID();
    const body = await this.post('/existence/wallet', { requestId, clientId: this.clientId, fiscalCode });
    expect(body.requestId).toBe(requestId);
    return body;
  }

  /**
   * pre-load-ის შემდეგ ლინკი: existence/wallet იმავე CF-ით →
   * exists false · prePopulated true · onboardingUrl ?ref=<token> · onboardingExpiresAt მომავალში → ref
   */
  async onboardingLink(fiscalCode: string): Promise<string> {
    const body = await this.existenceWallet(fiscalCode);
    console.log(`existence/wallet ${fiscalCode} → ${JSON.stringify({ exists: body.exists, prePopulated: body.prePopulated, onboardingUrl: body.onboardingUrl, onboardingExpiresAt: body.onboardingExpiresAt })}`);

    expect(body.resultCode).toBe(200);
    expect(body.exists).toBe(false);
    expect(body.prePopulated, 'prePopulated after prePopulateKyc').toBe(true);
    expect(body.onboardingUrl, 'onboardingUrl must carry ?ref=').toMatch(/[?&]ref=[^&]+/);
    expect(body.onboardingExpiresAt, 'onboardingExpiresAt missing').toBeTruthy();
    expect(new Date(body.onboardingExpiresAt).getTime()).toBeGreaterThan(Date.now());

    return new URL(body.onboardingUrl).searchParams.get('ref')!;
  }

  /**
   * prePopulateKyc სრული flow + ასერტები: ახალი ინდივიდი → 200 Success → ACCEPTED (received 1 / accepted 1 / rejected 0)
   */
  async prePopulateNewIndividual(document?: KycDocument) {
    const person = this.individual(document);
    expect(person.birth.date < '2000-01-01', `birth ${person.birth.date} must be before 2000`).toBeTruthy();
    expect(person.fiscalCode).toMatch(/^[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/);
    expect(person.mobile).toMatch(/^3\d{9}$/);
    const body = await this.prePopulateKyc([person]);

    expect(body.resultCode).toBe(200);
    expect(body.resultMessage).toBe('Success');
    expect(body.batchId, 'batchId missing').toBeTruthy();
    expect(body.received).toBe(1);
    expect(body.accepted).toBe(1);
    expect(body.rejected).toBe(0);

    const [result] = body.results as PrePopulateResult[];
    expect(result.fiscalCode).toBe(person.fiscalCode);
    expect(result.outcome, `${result.errorCode ?? ''} ${result.errorMessage ?? ''}`).toBe('ACCEPTED');

    const doc = person.documents[0];
    console.log(
      `✅ prePopulateKyc — ${person.fiscalCode} ${person.name} ${person.surname} (${person.birth.date}, +39 ${person.mobile}, ` +
        `${doc.type}/${doc.releaseInstitution}) → ${result.outcome} (batch ${body.batchId})`
    );

    const ref = await this.onboardingLink(person.fiscalCode);
    console.log(`✅ onboarding link — ref ${ref.slice(0, 6)}…`);
    return { person, ref };
  }

  /** pre-loaded ლინკის ნაბიჯები (ფრონტის გაიდი §1) — portal-service, public (ტოკენის გარეშე) */
  protected preloadedUrl = `${process.env.WALLETPORTAL_BASE_URL || 'https://walletportal.dev.keepz.it'}/api/v2/auth/preloaded`;

  /**
   * §1.2 verify-sms OTP 111111 → { userSMSId, phoneNumberDetails } — სრული ნომერი = pre-load-ის ნომერი → userSMSId
   */
  protected async verifySms(ref: string, mobile: string): Promise<string> {
    const res = await this.request.post(`${this.preloadedUrl}/verify-sms`, { data: { ref, code: '111111' } });
    expect(res.status(), `verify-sms ${mobile}`).toBe(200);
    const value = (await res.json()).value;
    expect(value.userSMSId, 'userSMSId missing').toBeTruthy();
    expect(value.phoneNumberDetails, 'verify-sms phoneNumberDetails').toEqual({ countryCode: '39', phoneNumber: mobile });
    return value.userSMSId;
  }

  /**
   * ლინკის გახსნა ერთ იუზერზე: open → OTP 111111 (whitelisted ნომერი) → fields →
   * maskedMobile = მისივე ნომერი, accountType USER, ფორმაში name/lastName = მისივე მონაცემები
   */
  async openLinkAndCheckPrefilled(person: Individual, ref: string) {
    const openRes = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    const open = (await openRes.json()).value;
    console.log(`open ${person.fiscalCode} → ${openRes.status()} ${JSON.stringify(open)}`);
    expect(openRes.status()).toBe(200);
    expect(open.accountType).toBe('USER');
    expect(open.otpSent).toBe(true);
    expect(open.maskedMobile).toMatch(new RegExp(`${person.mobile.slice(-3)}$`));
    expect(open.maskedMobile, 'full mobile must not be shown').not.toContain(person.mobile);

    const userSMSId = await this.verifySms(ref, person.mobile);

    const fieldsRes = await this.request.get(`${this.preloadedUrl}/fields?ref=${ref}&userSMSId=${userSMSId}&language=en`);
    expect(fieldsRes.status()).toBe(200);
    const pages = (await fieldsRes.json()).value as Record<string, { fields: { fieldName: string; value?: string }[] }>;
    const fields = Object.fromEntries(Object.values(pages).flatMap((p) => p.fields).map((f) => [f.fieldName, f.value]));
    console.log(`fields ${person.fiscalCode} → ${JSON.stringify(fields)}`);

    expect(fields.name).toBe(person.name);
    expect(fields.lastName).toBe(person.surname);
    expect(fields.password, 'password must be empty').toBeFalsy();
    console.log(`✅ link ${person.name} ${person.surname} (+39 ${person.mobile}) → OTP ok → form pre-filled`);
  }

  /** 2 ინდივიდი ერთად → თითოეულის ლინკი → ჯერ პირველი, მერე მეორე: open → OTP → შევსებული ფორმა (ერთმანეთში არ ერევა) */
  async prePopulateTwoAndOpenLinks() {
    const people = [this.individual(), this.individual()];
    people.forEach((p) => { p.mobile = nextPreloadPhone(); p.email = nextKeepzitEmail(); });

    const body = await this.prePopulateKyc(people);
    expect(body.accepted).toBe(2);
    expect(body.rejected).toBe(0);
    console.log(`✅ prePopulateKyc — 2 individuals: ${people.map((p) => `${p.name} ${p.surname} +39 ${p.mobile}`).join(', ')}`);

    const refs = [];
    for (const person of people) refs.push(await this.onboardingLink(person.fiscalCode));
    expect(refs[0]).not.toBe(refs[1]);

    for (const [i, person] of people.entries()) await this.openLinkAndCheckPrefilled(person, refs[i]);
  }

  /** 50 ინდივიდი ერთ call-ში (ლიმიტი, §7.8) → 200, received/accepted 50, rejected 0, ყველა ACCEPTED, CF-ები ემთხვევა */
  async prePopulateMaxBatch(size = 50) {
    const individuals = Array.from({ length: size }, () => this.individual());
    const body = await this.prePopulateKyc(individuals);

    expect(body.resultCode).toBe(200);
    expect(body.batchId, 'batchId missing').toBeTruthy();
    expect(body.received).toBe(size);
    expect(body.accepted).toBe(size);
    expect(body.rejected).toBe(0);

    const results = body.results as PrePopulateResult[];
    expect(results).toHaveLength(size);
    expect(results.filter((r) => r.outcome !== 'ACCEPTED'), 'not ACCEPTED').toEqual([]);
    expect(results.map((r) => r.fiscalCode).sort()).toEqual(individuals.map((i) => i.fiscalCode).sort());

    console.log(`✅ prePopulateKyc — batch of ${size} → ${body.accepted} ACCEPTED (batch ${body.batchId})`);
  }

  /** იგივე fiscalCode მეორედ → idempotent: 200, accepted 1, outcome UPDATED (არა დუბლიკატი, არა ერორი) */
  async prePopulateSameFiscalCode() {
    const { person } = await this.prePopulateNewIndividual();
    const body = await this.prePopulateKyc([{ ...person, email: uniqueMailinatorEmail() }]);

    expect(body.resultCode).toBe(200);
    expect(body.received).toBe(1);
    expect(body.rejected).toBe(0);
    const [result] = body.results as PrePopulateResult[];
    expect(result.fiscalCode).toBe(person.fiscalCode);
    expect(result.outcome, `${result.errorCode ?? ''} ${result.errorMessage ?? ''}`).toBe('UPDATED');
    console.log(`✅ prePopulateKyc — same ${person.fiscalCode} → UPDATED`);
  }

  // ───────────── ნეგატიური (§7.11) ─────────────

  /** auth ერორი: overrides ცვლის/შლის (undefined) ველს → status + code */
  async authError(overrides: Record<string, string | undefined>, status: number, code: string) {
    const requestId = randomUUID();
    const data: Record<string, string | undefined> = {
      requestId,
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      ...overrides,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const res = await this.rawPost('/operations/external/auth', data);
    this.expectError(res, status, code, requestId);
    expect(res.body.access_token, 'no token on error').toBeUndefined();
  }

  /** body-ში სხვა clientId, ვიდრე ტოკენშია → 403 CLIENT_MISMATCH */
  async clientMismatch() {
    const requestId = randomUUID();
    const res = await this.rawPost(
      '/prePopulateKyc',
      { requestId, clientId: 'retail-00000000-0000-0000-0000-000000000000', individuals: [this.individual()] },
      await this.auth()
    );
    this.expectError(res, 403, 'CLIENT_MISMATCH', requestId);
  }

  /** 51 ინდივიდი (ლიმიტი 50) → 413 BATCH_SIZE_EXCEEDED, არაფერი ინახება */
  async batchSizeExceeded() {
    const requestId = randomUUID();
    const individuals = Array.from({ length: 51 }, () => this.individual());
    const res = await this.rawPost('/prePopulateKyc', { requestId, clientId: this.clientId, individuals }, await this.auth());
    this.expectError(res, 413, 'BATCH_SIZE_EXCEEDED', requestId);
    expect(res.body.batchId, 'no batch on rejection').toBeUndefined();
  }

  /** არავალიდური ინდივიდი → batch 200, accepted 0, rejected 1, REJECTED + errorCode + ველი errorMessage-ში */
  async rejectedIndividual(caseName: InvalidIndividualCase) {
    const { field, errorCode, mutate } = INVALID_INDIVIDUAL[caseName];
    const person = this.individual();
    mutate(person);
    const body = await this.prePopulateKyc([person]);
    console.log(`${caseName} → ${JSON.stringify(body.results)}`);

    expect(body.resultCode).toBe(200);
    expect(body.received).toBe(1);
    const [result] = body.results as PrePopulateResult[];
    expect(result.outcome, `${caseName}: expected REJECTED`).toBe('REJECTED');
    expect(body.accepted).toBe(0);
    expect(body.rejected).toBe(1);
    expect(result.errorCode).toBe(errorCode);
    expect(result.errorMessage).toContain(field);
  }

  /** ვადაგასული დოკუმენტი → ინდივიდი REJECTED, errorCode EXPIRED_DOCUMENT (batch 200, accepted 0) */
  async expiredDocument() {
    const person = this.individual();
    person.documents[0].releaseDate = '2010-01-15';
    person.documents[0].expiryDate = '2020-01-15';
    const body = await this.prePopulateKyc([person]);
    console.log(`EXPIRED_DOCUMENT → ${JSON.stringify(body)}`);

    expect(body.resultCode).toBe(200);
    expect(body.received).toBe(1);
    expect(body.accepted).toBe(0);
    expect(body.rejected).toBe(1);
    const [result] = body.results as PrePopulateResult[];
    expect(result.fiscalCode).toBe(person.fiscalCode);
    expect(result.outcome).toBe('REJECTED');
    expect(result.errorCode).toBe('EXPIRED_DOCUMENT');
    expect(result.errorMessage, 'errorMessage missing').toBeTruthy();
  }

  // ───────────── არსებული კლიენტი — alreadyRegistered + attach (ფრონტის გაიდი §1.1, §1.6) ─────────────

  private portalUrl = process.env.WALLETPORTAL_BASE_URL || 'https://walletportal.dev.keepz.it';
  /** §3: პორტალი attach-ს portal-service-ზე იძახებს (common-service-ის იგივე path); PRELOAD_ATTACH_URL — სხვა base-ის შესამოწმებლად */
  private attachUrl = process.env.PRELOAD_ATTACH_URL || `${this.portalUrl}/api/v1/profile/verification/preloaded/attach`;

  /**
   * ref-ით რეგისტრაცია API-ით (§1.1-1.3, §3.5): pool ნომერი + keepzitNN მეილი → open → OTP 111111 → fields →
   * web-registration ref-ით → ანგარიში. გამოყენებული ლინკი → open 404 / 3212
   */
  async registerViaLink() {
    const person = this.individual();
    person.mobile = nextPreloadPhone();
    person.email = nextKeepzitEmail();
    expect((await this.prePopulateKyc([person])).results[0].outcome).toBe('ACCEPTED');
    const ref = await this.onboardingLink(person.fiscalCode);

    const open = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    expect(open.status()).toBe(200);
    expect((await open.json()).value.alreadyRegistered).toBe(false);
    const userSMSId = await this.verifySms(ref, person.mobile);

    const fieldsRes = await this.request.get(`${this.preloadedUrl}/fields?ref=${ref}&userSMSId=${userSMSId}&language=en`);
    expect(fieldsRes.status()).toBe(200);
    const pages = (await fieldsRes.json()).value as Record<string, { fields: { fieldName: string }[] }>;
    const docIds = Object.values(pages).flatMap((p) => p.fields).map((f) => f.fieldName.match(/^doc_(\d+)$/)?.[1]).filter(Boolean).map(Number);

    const reg = await this.request.post(`${this.portalUrl}/api/v2/auth/web-registration`, {
      data: {
        ref,
        userSMSId,
        userType: 'BUSINESS',
        accountType: 'USER',
        deviceToken: null,
        data: {
          name: person.name,
          lastName: person.surname,
          password: TEST_PASSWORD,
          confirmPassword: TEST_PASSWORD,
          consent_NEWSLETTER: false,
          consent_MARKETING: false,
          ...Object.fromEntries(docIds.map((id) => [`doc_${id}`, true])),
        },
        legal: { acceptedDocumentIds: docIds, consents: [{ type: 'MARKETING', value: false }, { type: 'NEWSLETTER', value: false }] },
      },
    });
    expect(reg.ok(), `web-registration → ${reg.status()}: ${await reg.text()}`).toBeTruthy();
    console.log(`✅ registered via link — ${person.name} ${person.surname} (+39 ${person.mobile})`);
    return { person, ref };
  }

  /** პორტალის login (§ ჩვეულებრივი): exists → pre-login → validate-and-send-otp → web-login OTP 111111 → accessToken */
  async userLogin(mobile: string): Promise<string> {
    const base = `${this.portalUrl}/api/v1/auth`;
    const call = async (path: string, data?: object) => {
      const res = data ? await this.request.post(`${base}${path}`, { data }) : await this.request.get(`${base}${path}`);
      expect(res.ok(), `${path} → ${res.status()}: ${await res.text()}`).toBeTruthy();
      return (await res.json().catch(() => ({}))).value;
    };
    await call(`/exists?countryCode=39&mobile=${mobile}`); // მის გარეშე validate-and-send-otp → 1004
    const { sessionToken } = await call('/pre-login', { countryCode: '39', mobileNumber: mobile, password: TEST_PASSWORD });
    await call('/validate-and-send-otp', { sessionToken, userType: 'BUSINESS' });
    const { accessToken } = await call('/web-login', {
      countryCode: '39', deviceToken: null, mobileNumber: mobile, otp: '111111', sessionToken, userType: 'BUSINESS',
    });
    return accessToken;
  }

  /** attach → { status, body } (status check-ის გარეშე) */
  async attach(ref: string, token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await this.request.post(this.attachUrl, { data: { ref }, headers });
    const body = await res.json().catch(() => ({}));
    console.log(`attach → ${res.status()} ${JSON.stringify(body)}`);
    return { status: res.status(), body };
  }

  /** ახალი pre-load იმავე მობილურზე (სხვა CF) → ლინკი → open: alreadyRegistered true, otpSent false, USER */
  async preloadForExistingCustomer(mobile: string, email: string) {
    const person = this.individual();
    person.mobile = mobile;
    person.email = email;
    person.addresses[0].street = 'Via Milano'; // რომ ჩანდეს — KYC ახალი pre-load-ით შეივსო
    expect((await this.prePopulateKyc([person])).results[0].outcome).toBe('ACCEPTED');
    const ref = await this.onboardingLink(person.fiscalCode);

    const res = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    const open = (await res.json()).value;
    console.log(`open (existing +39 ${mobile}) → ${res.status()} ${JSON.stringify(open)}`);
    expect(res.status()).toBe(200);
    expect(open.alreadyRegistered, 'alreadyRegistered').toBe(true);
    expect(open.otpSent, 'no OTP for an existing account').toBe(false);
    expect(open.accountType).toBe('USER');
    expect(open.maskedMobile).toMatch(new RegExp(`${mobile.slice(-3)}$`));
    return { person, ref };
  }

  /** attach 200 → value: alreadyRegistered true, USER, maskedMobile = მისი ნომერი */
  async attachOk(ref: string, token: string, mobile: string) {
    const { status, body } = await this.attach(ref, token);
    expect(status, body?.message).toBe(200);
    expect(body.value.alreadyRegistered).toBe(true);
    expect(body.value.accountType).toBe('USER');
    expect(body.value.maskedMobile).toMatch(new RegExp(`${mobile.slice(-3)}$`));
  }

  /** attach ერორი — HTTP + statusCode + message */
  private expectAttachError(res: { status: number; body: any }, status: number, statusCode: number) {
    expect(res.status, res.body?.message).toBe(status);
    expect(res.body.statusCode).toBe(statusCode);
    expect(res.body.message, 'error message missing').toBeTruthy();
  }

  /** სხვა ანგარიშის ლინკი (სხვა მობილური) → 400 / 3214 PRELOAD_MISMATCH */
  async attachOtherAccountLink() {
    const { person } = await this.registerViaLink();
    const token = await this.userLogin(person.mobile);
    const other = this.individual(); // შემთხვევითი, დაურეგისტრირებელი მობილური
    expect((await this.prePopulateKyc([other])).results[0].outcome).toBe('ACCEPTED');
    const ref = await this.onboardingLink(other.fiscalCode);
    this.expectAttachError(await this.attach(ref, token), 400, 3214);
  }

  /** იგივე ლინკი მეორედ → პირველი 200, მეორე 404 / 3212 (ლინკი გამოყენებულია); open-იც 3212 */
  async attachSameLinkTwice() {
    const { person } = await this.registerViaLink();
    const token = await this.userLogin(person.mobile);
    const { ref } = await this.preloadForExistingCustomer(person.mobile, person.email);
    await this.attachOk(ref, token, person.mobile);
    this.expectAttachError(await this.attach(ref, token), 404, 3212);
    const open = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    expect(open.status()).toBe(404);
    expect((await open.json()).statusCode).toBe(3212);
  }

  /** არავალიდური ref → 404 / 3212 */
  async attachInvalidRef() {
    const { person } = await this.registerViaLink();
    const token = await this.userLogin(person.mobile);
    this.expectAttachError(await this.attach('invalid-ref-123', token), 404, 3212);
  }

  /** ტოკენის გარეშე → 401 */
  async attachWithoutToken() {
    const { ref } = await this.prePopulateNewIndividual();
    const { status } = await this.attach(ref);
    expect(status).toBe(401);
  }

  /** ref-ით რეგისტრაციის შემდეგ იგივე ლინკი → open 404 / 3212 (ლინკი გამოყენებულია) */
  async openUsedLink() {
    const { ref } = await this.registerViaLink();
    const res = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    const body = await res.json();
    console.log(`open used link → ${res.status()} ${JSON.stringify(body)}`);
    expect(res.status()).toBe(404);
    expect(body.statusCode).toBe(3212);
  }

  /** verification დაწყებულია (KYC გვერდი შენახულია) → 409 / 3215 */
  async attachAfterVerificationStarted(mobile: string, email: string) {
    const token = await this.userLogin(mobile);
    const { ref } = await this.preloadForExistingCustomer(mobile, email);
    this.expectAttachError(await this.attach(ref, token), 409, 3215);
  }
}
