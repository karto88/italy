import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — pre-loaded onboarding KYB, partner API (KeepzWalletService v2.5.0 §7.9).
 * prePopulateKyb — positive: ახალი merchant (კომპანია + წარმომადგენელი + shop) → 200 Success → ACCEPTED.
 *   ლინკი = existence/wallet კომპანიის CF-ით (merchants[].fiscalCode) · open → MERCHANT · OTP წარმომადგენლის ნომერზე.
 * flow + ასერტები: utils/PartnerKybApi.ts
 */
test.describe('prePopulateKyb', () => {
  test('prePopulateKyb — 1 merchant, 1 shop — ACCEPTED + onboarding link', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateNewMerchant();
  });

  test('prePopulateKyb — 1 merchant, 3 shops — merchant and all shops ACCEPTED', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateNewMerchant(3);
  });

  test('prePopulateKyb — PEP legal representative (type + relationship) — ACCEPTED', async ({ partnerKyb }) => {
    await partnerKyb.prePopulatePepMember();
  });

  test('prePopulateKyb — 2 merchants — each link → MERCHANT → OTP → registration form pre-filled', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateTwoMerchantsAndOpenLinks();
  });

  test('prePopulateKyb — 50 merchants in one call (limit) — all ACCEPTED', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateMaxMerchantBatch();
  });

  test('prePopulateKyb — same merchantId again — merchant and shop UPDATED (idempotent)', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateSameMerchantId();
  });

  test('prePopulateKyb — shop status SUSPENDED — ACCEPTED', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateShopStatus('SUSPENDED');
  });

  test('prePopulateKyb — shop status CLOSED — ACCEPTED', async ({ partnerKyb }) => {
    await partnerKyb.prePopulateShopStatus('CLOSED');
  });

  test('prePopulateKyb — company fiscal code 11 digits — onboarding link returned', async ({ partnerKyb }) => {
    await partnerKyb.linkByElevenDigitCompanyFiscalCode();
  });
});
