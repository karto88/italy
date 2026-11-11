import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — pre-loaded onboarding KYB, partner API — negative (KeepzWalletService v2.5.0 §7.9, §7.11).
 * auth-ის ერორები საერთოა (Partner-preload-kyc/negative), აქ — მხოლოდ prePopulateKyb.
 * merchant-ის ცუდი ველი → merchant REJECTED; shop-ის ცუდი ველი → merchant ACCEPTED, shop REJECTED (shopResults).
 * flow + ასერტები: utils/PartnerKybApi.ts
 */
test.describe('prePopulateKyb — negative', () => {
  test('prePopulateKyb — clientId differs from token — 403 / CLIENT_MISMATCH', async ({ partnerKyb }) => {
    await partnerKyb.kybClientMismatch();
  });

  test('prePopulateKyb — 51 merchants — 413 / BATCH_SIZE_EXCEEDED', async ({ partnerKyb }) => {
    await partnerKyb.kybBatchSizeExceeded();
  });

  // merchant
  test('prePopulateKyb — empty businessName — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('businessNameEmpty');
  });

  test('prePopulateKyb — empty vatNumber — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('vatNumberEmpty');
  });

  test('prePopulateKyb — empty email — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('emailEmpty');
  });

  test('prePopulateKyb — legalAddress missing — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('legalAddressMissing');
  });

  test('prePopulateKyb — empty members — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('membersEmpty');
  });

  test('prePopulateKyb — empty shops — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('shopsEmpty');
  });

  test('prePopulateKyb — empty legalForm — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('legalFormEmpty');
  });

  test('prePopulateKyb — invalid vatNumber (3 digits) — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('vatNumberInvalid');
  });

  test('prePopulateKyb — invalid legalAddress provCode — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('legalAddressProvCodeInvalid');
  });

  // company fiscal code (ლინკის გასაღები)
  test('prePopulateKyb — invalid company fiscalCode — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('companyFiscalCodeInvalid');
  });

  test('prePopulateKyb — company fiscalCode 16 characters (personal CF format) — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('companyFiscalCodeSixteenChars');
  });

  test('prePopulateKyb — company fiscalCode missing — REJECTED (no link possible)', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('companyFiscalCodeMissing');
  });

  test('existence/wallet — legal representative fiscal code — no onboarding link', async ({ partnerKyb }) => {
    await partnerKyb.noLinkByRepresentativeFiscalCode();
  });

  // members
  test('prePopulateKyb — invalid member fiscalCode — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('memberFiscalCodeInvalid');
  });

  test('prePopulateKyb — member amlPep true without type/relationship — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('memberPepWithoutType');
  });

  test('prePopulateKyb — invalid member gender — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('memberGenderInvalid');
  });

  test('prePopulateKyb — no legal representative among members — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('noLegalRepresentative');
  });

  test('prePopulateKyb — legal representative without mobile — REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedMerchant('legalRepresentativeWithoutMobile');
  });

  // shops
  test('prePopulateKyb — invalid shop status — merchant ACCEPTED, shop REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedShop('shopStatusInvalid');
  });

  test('prePopulateKyb — empty shop name — merchant ACCEPTED, shop REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.rejectedShop('shopNameEmpty');
  });

  test('prePopulateKyb — 2 shops, one invalid — merchant ACCEPTED, only that shop REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.oneOfTwoShopsRejected();
  });

  test('prePopulateKyb — idShop already registered for another merchant — shop REJECTED', async ({ partnerKyb }) => {
    await partnerKyb.idShopOfAnotherMerchant();
  });
});
