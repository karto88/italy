import { expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { PartnerApi } from './PartnerApi';
import { nextKeepzitEmail, nextPreloadPhone, uniqueCompanyName, uniqueTaxCode } from './randomData';

/**
 * PartnerKybApi — KeepzWalletService v2 partner API, KYB (KI-456, §7.9 prePopulateKyb).
 * auth / token / existence/wallet / ლინკის ნაბიჯები — PartnerApi-დან.
 * merchant-ის ლინკი = existence/wallet კომპანიის fiscalCode-ით (merchants[].fiscalCode; წარმომადგენლის CF-ით — prePopulated false),
 * OTP მიდის წარმომადგენლის მობილურზე, open → accountType MERCHANT.
 */
export interface KybShopResult {
  idShop: string;
  outcome: 'ACCEPTED' | 'UPDATED' | 'REJECTED';
  errorCode?: string;
  errorMessage?: string;
}

export interface KybResult {
  merchantId: string;
  outcome: 'ACCEPTED' | 'UPDATED' | 'REJECTED';
  shopResults?: KybShopResult[];
  errorCode?: string;
  errorMessage?: string;
}

export type Merchant = ReturnType<PartnerKybApi['merchant']>;

/** ნეგატიური ქეისები: merchant-ის ცვლილება → მოსალოდნელი errorCode + ველი errorMessage-ში (merchant REJECTED) */
export const INVALID_MERCHANT = {
  businessNameEmpty: { field: 'businessName', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.businessName = ''; } },
  vatNumberEmpty: { field: 'vatNumber', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.vatNumber = ''; } },
  emailEmpty: { field: 'email', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.email = ''; } },
  legalAddressMissing: { field: 'legalAddress', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { delete (m as any).legalAddress; } },
  membersEmpty: { field: 'members', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.members = []; } },
  shopsEmpty: { field: 'shops', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.shops = []; } },
  memberFiscalCodeInvalid: { field: 'fiscalCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { m.members[0].fiscalCode = 'ABC123'; } },
  memberPepWithoutType: { field: 'amlPepType', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.members[0].amlPep = true; } },
  companyFiscalCodeInvalid: { field: 'fiscalCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { m.fiscalCode = 'ABC123'; } },
  // კომპანიის CF მხოლოდ 11 ციფრი — 16-სიმბოლოიანი (პირადი CF ფორმატი) არა
  companyFiscalCodeSixteenChars: { field: 'fiscalCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { m.fiscalCode = m.members[0].fiscalCode; } },
  // ლინკის გასაღებია, ამიტომ მის გარეშე merchant გამოუსადეგარია (DEV: ACCEPTED, ლინკი არ მოდის)
  companyFiscalCodeMissing: { field: 'fiscalCode', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { delete (m as any).fiscalCode; } },
  legalFormEmpty: { field: 'legalForm', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.legalForm = ''; } },
  vatNumberInvalid: { field: 'vatNumber', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { m.vatNumber = '123'; } },
  // DEV: ACCEPTED (KI-489-ის მსგავსი)
  legalAddressProvCodeInvalid: { field: 'provCode', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { m.legalAddress.provCode = 'XX'; } },
  memberGenderInvalid: { field: 'gender', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { (m.members[0] as any).gender = 'X'; } },
  noLegalRepresentative: { field: 'legal representative', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.members[0].legalRepresentative = false; } },
  legalRepresentativeWithoutMobile: { field: 'mobile', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.members[0].mobile = ''; } },
};

export type InvalidMerchantCase = keyof typeof INVALID_MERCHANT;

/** shop-ის ცვლილება → merchant ACCEPTED, shop REJECTED (§7.9) */
export const INVALID_SHOP = {
  shopStatusInvalid: { field: 'status', errorCode: 'INVALID_FIELD_VALUE', mutate: (m: Merchant) => { (m.shops[0] as any).status = 'XXX'; } },
  shopNameEmpty: { field: 'name', errorCode: 'MISSING_MANDATORY_FIELD', mutate: (m: Merchant) => { m.shops[0].name = ''; } },
};

export type InvalidShopCase = keyof typeof INVALID_SHOP;

export class PartnerKybApi extends PartnerApi {
  private shop(stamp: string) {
    return {
      idShop: `S-${stamp}`,
      name: `Shop ${stamp}`,
      address: { type: 'OPERATIONAL', street: 'Via Milano', number: '5', zipCode: '20100', cityName: 'Milano', provCode: 'MI', countryCode: 'ITA' },
      status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'CLOSED',
    };
  }

  /**
   * ერთი merchant-ის მონაცემი (§7.9): კომპანია (SR, 11-ციფრიანი VAT) + 1 წარმომადგენელი
   * (legalRepresentative / signer / beneficialOwner, PEP არა) + shopCount shop.
   */
  merchant(shopCount = 1) {
    const rep = this.individual();
    const stamp = randomUUID().slice(0, 8);
    const email = nextKeepzitEmail();
    return {
      merchantId: `M-${stamp}`,
      businessName: uniqueCompanyName(),
      legalForm: 'SR',
      vatNumber: uniqueTaxCode(),
      fiscalCode: '8' + String(Math.floor(Math.random() * 1e10)).padStart(10, '0'), // კომპანიის CF — ლინკის გასაღები, 11 ციფრი (≠ VAT); prePopulateKyb 16-სიმბოლოიანს აღარ იღებს
      sae: '430', // ყოველთვის 430 / 702009 (Azienda: Codice SAE / ATECO)
      ateco: '702009',
      reaProvince: 'MI',
      reaNumber: String(Date.now()).slice(-6),
      reaDate: '2025-03-08',
      email,
      pec: email,
      phonePrefix: '+39',
      phone: '3' + String(Date.now()).slice(-9), // ფრონტი: მხოლოდ 3-ით (0-ით დაწყებული → "Formato non valido")
      legalAddress: { type: 'LEGAL', street: 'Via Roma', number: '10', zipCode: '00100', cityName: 'Roma', provCode: 'RM', countryCode: 'ITA' },
      members: [
        {
          fiscalCode: rep.fiscalCode,
          name: rep.name,
          surname: rep.surname,
          gender: rep.gender,
          birth: rep.birth,
          email: rep.email,
          mobilePrefix: '+39',
          mobile: rep.mobile,
          legalRepresentative: true,
          signer: true,
          beneficialOwner: true,
          amlPep: false,
          amlPepType: undefined as string | undefined,
          amlPepRelationship: undefined as string | undefined,
        },
      ],
      shops: Array.from({ length: shopCount }, (_, i) => this.shop(`${stamp}-${i + 1}`)),
    };
  }

  /** §7.9 prePopulateKyb → სრული პასუხი */
  async prePopulateKyb(merchants: object[]) {
    const requestId = randomUUID();
    const body = await this.post('/prePopulateKyb', { requestId, clientId: this.clientId, merchants });
    expect(body.requestId).toBe(requestId);
    expect(body.clientId).toBe(this.clientId);
    return body;
  }

  /** merchant ACCEPTED/UPDATED + ყველა shop იგივე outcome-ით */
  private expectMerchant(result: KybResult, merchant: Merchant, outcome: 'ACCEPTED' | 'UPDATED') {
    expect(result.merchantId).toBe(merchant.merchantId);
    expect(result.outcome, `${result.errorCode ?? ''} ${result.errorMessage ?? ''}`).toBe(outcome);
    expect(result.shopResults?.map((s) => s.idShop).sort()).toEqual(merchant.shops.map((s) => s.idShop).sort());
    expect(result.shopResults!.filter((s) => s.outcome !== outcome), `shops not ${outcome}`).toEqual([]);
  }

  /**
   * prePopulateKyb სრული flow + ასერტები: ახალი merchant → 200 Success → ACCEPTED (received 1 / accepted 1 / rejected 0),
   * shop-ები ACCEPTED → existence/wallet კომპანიის CF-ით → ლინკი
   */
  async prePopulateNewMerchant(shopCount = 1) {
    const merchant = this.merchant(shopCount);
    const body = await this.prePopulateKyb([merchant]);

    expect(body.resultCode).toBe(200);
    expect(body.resultMessage).toBe('Success');
    expect(body.batchId, 'batchId missing').toBeTruthy();
    expect(body.received).toBe(1);
    expect(body.accepted).toBe(1);
    expect(body.rejected).toBe(0);
    this.expectMerchant(body.results[0], merchant, 'ACCEPTED');

    const rep = merchant.members[0];
    console.log(
      `✅ prePopulateKyb — ${merchant.merchantId} ${merchant.businessName} (VAT ${merchant.vatNumber}, CF ${merchant.fiscalCode}, ` +
        `rep ${rep.name} ${rep.surname} ${rep.fiscalCode}, ${shopCount} shop) → ACCEPTED (batch ${body.batchId})`
    );

    const ref = await this.onboardingLink(merchant.fiscalCode);
    console.log(`✅ onboarding link — ref ${ref.slice(0, 6)}…`);
    return { merchant, ref };
  }

  /**
   * merchant-ის ლინკი: open → MERCHANT, OTP წარმომადგენლის ნომერზე → verify-sms → fields:
   * name = businessName, personalNumber = კომპანიის CF, email, legalRepresentativeName/Surname
   */
  async openMerchantLinkAndCheckPrefilled(merchant: Merchant, ref: string) {
    const rep = merchant.members[0];
    const openRes = await this.request.post(`${this.preloadedUrl}/open`, { data: { ref } });
    const open = (await openRes.json()).value;
    console.log(`open ${merchant.merchantId} → ${openRes.status()} ${JSON.stringify(open)}`);
    expect(openRes.status()).toBe(200);
    expect(open.accountType).toBe('MERCHANT');
    expect(open.alreadyRegistered).toBe(false);
    expect(open.otpSent).toBe(true);
    expect(open.maskedMobile).toMatch(new RegExp(`${rep.mobile.slice(-3)}$`));
    expect(open.maskedMobile, 'full mobile must not be shown').not.toContain(rep.mobile);

    const userSMSId = await this.verifySms(ref, rep.mobile);

    const fieldsRes = await this.request.get(`${this.preloadedUrl}/fields?ref=${ref}&userSMSId=${userSMSId}&language=en`);
    expect(fieldsRes.status()).toBe(200);
    const pages = (await fieldsRes.json()).value as Record<string, { fields: { fieldName: string; value?: string }[] }>;
    const fields = Object.fromEntries(Object.values(pages).flatMap((p) => p.fields).map((f) => [f.fieldName, f.value]));
    console.log(`fields ${merchant.merchantId} → ${JSON.stringify(fields)}`);

    expect(fields.name, 'business name').toBe(merchant.businessName);
    expect(fields.personalNumber, 'company fiscal code').toBe(merchant.fiscalCode);
    expect(fields.email).toBe(merchant.email);
    expect(fields.legalRepresentativeName).toBe(rep.name);
    expect(fields.legalRepresentativeSurname).toBe(rep.surname);
    expect(fields.password, 'password must be empty').toBeFalsy();
    console.log(`✅ link ${merchant.businessName} (rep +39 ${rep.mobile}) → OTP ok → form pre-filled`);
  }

  /** 2 merchant ერთად → თითოეულის ლინკი → open MERCHANT → OTP → შევსებული ფორმა (ერთმანეთში არ ერევა) */
  async prePopulateTwoMerchantsAndOpenLinks() {
    const merchants = [this.merchant(), this.merchant()];
    merchants.forEach((m) => { m.members[0].mobile = nextPreloadPhone(); });

    const body = await this.prePopulateKyb(merchants);
    expect(body.accepted).toBe(2);
    expect(body.rejected).toBe(0);
    console.log(`✅ prePopulateKyb — 2 merchants: ${merchants.map((m) => `${m.businessName} +39 ${m.members[0].mobile}`).join(', ')}`);

    const refs = [];
    for (const m of merchants) refs.push(await this.onboardingLink(m.fiscalCode));
    expect(refs[0]).not.toBe(refs[1]);

    for (const [i, m] of merchants.entries()) await this.openMerchantLinkAndCheckPrefilled(m, refs[i]);
  }

  /** 50 merchant ერთ call-ში (ლიმიტი, §7.9) → 200, received/accepted 50, rejected 0, ყველა ACCEPTED */
  async prePopulateMaxMerchantBatch(size = 50) {
    const merchants = Array.from({ length: size }, () => this.merchant());
    const body = await this.prePopulateKyb(merchants);

    expect(body.resultCode).toBe(200);
    expect(body.batchId, 'batchId missing').toBeTruthy();
    expect(body.received).toBe(size);
    expect(body.accepted).toBe(size);
    expect(body.rejected).toBe(0);

    const results = body.results as KybResult[];
    expect(results).toHaveLength(size);
    expect(results.filter((r) => r.outcome !== 'ACCEPTED'), 'not ACCEPTED').toEqual([]);
    expect(results.map((r) => r.merchantId).sort()).toEqual(merchants.map((m) => m.merchantId).sort());

    console.log(`✅ prePopulateKyb — batch of ${size} → ${body.accepted} ACCEPTED (batch ${body.batchId})`);
  }

  /** იგივე merchantId + idShop მეორედ → idempotent: 200, merchant და shop UPDATED */
  async prePopulateSameMerchantId() {
    const { merchant } = await this.prePopulateNewMerchant();
    const body = await this.prePopulateKyb([{ ...merchant, email: nextKeepzitEmail() }]);

    expect(body.resultCode).toBe(200);
    expect(body.received).toBe(1);
    expect(body.rejected).toBe(0);
    this.expectMerchant(body.results[0], merchant, 'UPDATED');
    console.log(`✅ prePopulateKyb — same ${merchant.merchantId} → UPDATED`);
  }

  /** წარმომადგენელი PEP (amlPep true + amlPepType + amlPepRelationship) → ACCEPTED */
  async prePopulatePepMember() {
    const merchant = this.merchant();
    Object.assign(merchant.members[0], { amlPep: true, amlPepType: 'DOMESTIC', amlPepRelationship: 'SELF' });
    const body = await this.prePopulateKyb([merchant]);
    expect(body.accepted).toBe(1);
    this.expectMerchant(body.results[0], merchant, 'ACCEPTED');
    console.log(`✅ prePopulateKyb — PEP member → ACCEPTED`);
  }

  /** shop-ის status SUSPENDED / CLOSED (§7.9 enum) → merchant და shop ACCEPTED */
  async prePopulateShopStatus(status: 'SUSPENDED' | 'CLOSED') {
    const merchant = this.merchant();
    merchant.shops[0].status = status;
    const body = await this.prePopulateKyb([merchant]);
    this.expectMerchant(body.results[0], merchant, 'ACCEPTED');
    console.log(`✅ prePopulateKyb — shop ${status} → ACCEPTED`);
  }

  // ───────────── ნეგატიური (§7.11) ─────────────

  /** body-ში სხვა clientId, ვიდრე ტოკენშია → 403 CLIENT_MISMATCH */
  async kybClientMismatch() {
    const requestId = randomUUID();
    const res = await this.rawPost(
      '/prePopulateKyb',
      { requestId, clientId: 'retail-00000000-0000-0000-0000-000000000000', merchants: [this.merchant()] },
      await this.auth()
    );
    this.expectError(res, 403, 'CLIENT_MISMATCH', requestId);
  }

  /** 51 merchant (ლიმიტი 50) → 413 BATCH_SIZE_EXCEEDED, არაფერი ინახება */
  async kybBatchSizeExceeded() {
    const requestId = randomUUID();
    const merchants = Array.from({ length: 51 }, () => this.merchant());
    const res = await this.rawPost('/prePopulateKyb', { requestId, clientId: this.clientId, merchants }, await this.auth());
    this.expectError(res, 413, 'BATCH_SIZE_EXCEEDED', requestId);
    expect(res.body.batchId, 'no batch on rejection').toBeUndefined();
  }

  /** 2 shop, მეორე არავალიდური → merchant ACCEPTED, shop 1 ACCEPTED, shop 2 REJECTED (§7.9) */
  async oneOfTwoShopsRejected() {
    const merchant = this.merchant(2);
    (merchant.shops[1] as any).status = 'XXX';
    const body = await this.prePopulateKyb([merchant]);
    console.log(`2 shops, 1 invalid → ${JSON.stringify(body.results)}`);
    const [result] = body.results as KybResult[];
    expect(result.outcome).toBe('ACCEPTED');
    const [ok, bad] = merchant.shops.map((s) => result.shopResults!.find((r) => r.idShop === s.idShop)!);
    expect(ok.outcome).toBe('ACCEPTED');
    expect(bad.outcome).toBe('REJECTED');
    expect(bad.errorCode).toBe('INVALID_FIELD_VALUE');
  }

  /** idShop უკვე სხვა merchant-ისაა → merchant ACCEPTED, shop REJECTED "already registered for another merchant" */
  async idShopOfAnotherMerchant() {
    const owner = this.merchant();
    await this.prePopulateKyb([owner]);
    const merchant = this.merchant();
    merchant.shops[0].idShop = owner.shops[0].idShop;
    const body = await this.prePopulateKyb([merchant]);
    console.log(`idShop of another merchant → ${JSON.stringify(body.results)}`);
    const [result] = body.results as KybResult[];
    expect(result.outcome).toBe('ACCEPTED');
    const [shop] = result.shopResults!;
    expect(shop.outcome).toBe('REJECTED');
    expect(shop.errorCode).toBe('INVALID_FIELD_VALUE');
    expect(shop.errorMessage).toContain('another merchant');
  }

  /** existence/wallet წარმომადგენლის CF-ით → ლინკი არა (prePopulated false, ref-ის გარეშე) — გასაღები კომპანიის CF-ია */
  async noLinkByRepresentativeFiscalCode() {
    const merchant = this.merchant();
    await this.prePopulateKyb([merchant]);
    const body = await this.existenceWallet(merchant.members[0].fiscalCode);
    console.log(`existence rep CF → prePopulated ${body.prePopulated} ${body.onboardingUrl}`);
    expect(body.prePopulated).toBe(false);
    expect(body.onboardingUrl).not.toContain('ref=');
  }

  /** კომპანიის CF 11 ციფრი (SRL-ის ფორმატი) → ACCEPTED → ლინკი უნდა მოვიდეს (DEV: existence 400 "Invalid Italian fiscal code") */
  async linkByElevenDigitCompanyFiscalCode() {
    const merchant = this.merchant();
    merchant.fiscalCode = merchant.vatNumber;
    const body = await this.prePopulateKyb([merchant]);
    this.expectMerchant(body.results[0], merchant, 'ACCEPTED');
    const res = await this.request.post(`${this.baseUrl}/existence/wallet`, {
      data: { requestId: randomUUID(), clientId: this.clientId, fiscalCode: merchant.fiscalCode },
      headers: { Authorization: `Bearer ${await this.auth()}` },
    });
    const ex = await res.json();
    console.log(`existence 11-digit company CF → ${res.status()} ${JSON.stringify({ prePopulated: ex.prePopulated, message: ex.message })}`);
    expect(res.status(), ex.message).toBe(200);
    expect(ex.prePopulated).toBe(true);
    expect(ex.onboardingUrl).toContain('ref=');
  }

  /** არავალიდური merchant → batch 200, accepted 0, rejected 1, REJECTED + errorCode + ველი errorMessage-ში */
  async rejectedMerchant(caseName: InvalidMerchantCase) {
    const { field, errorCode, mutate } = INVALID_MERCHANT[caseName];
    const merchant = this.merchant();
    mutate(merchant);
    const body = await this.prePopulateKyb([merchant]);
    console.log(`${caseName} → ${JSON.stringify(body.results)}`);

    expect(body.resultCode).toBe(200);
    expect(body.received).toBe(1);
    const [result] = body.results as KybResult[];
    expect(result.merchantId).toBe(merchant.merchantId);
    expect(result.outcome, `${caseName}: expected REJECTED`).toBe('REJECTED');
    expect(body.accepted).toBe(0);
    expect(body.rejected).toBe(1);
    expect(result.errorCode).toBe(errorCode);
    expect(result.errorMessage).toContain(field);
  }

  /** არავალიდური shop → merchant ACCEPTED (accepted 1), shop REJECTED + errorCode (§7.9) */
  async rejectedShop(caseName: InvalidShopCase) {
    const { field, errorCode, mutate } = INVALID_SHOP[caseName];
    const merchant = this.merchant();
    mutate(merchant);
    const body = await this.prePopulateKyb([merchant]);
    console.log(`${caseName} → ${JSON.stringify(body.results)}`);

    expect(body.resultCode).toBe(200);
    expect(body.accepted).toBe(1);
    const [result] = body.results as KybResult[];
    expect(result.outcome, 'merchant stays ACCEPTED').toBe('ACCEPTED');
    const [shop] = result.shopResults!;
    expect(shop.idShop).toBe(merchant.shops[0].idShop);
    expect(shop.outcome, `${caseName}: expected shop REJECTED`).toBe('REJECTED');
    expect(shop.errorCode).toBe(errorCode);
    expect(shop.errorMessage).toContain(field);
  }
}
