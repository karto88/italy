import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — pre-loaded onboarding, partner API (KeepzWalletService v2.5.0 §7.8).
 * prePopulateKyc — positive: ახალი ინდივიდი → 200 Success → ACCEPTED.
 *   დაბადება 2000-მდე · ვალიდური CF (RSSMRA87M22H501Z ფორმატი) · იტალიური 10-ციფრიანი მობილური
 *   დოკუმენტის 3 ტიპი, თითო თავისი გამცემი ორგანოთი.
 * flow + ასერტები: utils/PartnerApi.ts
 */
test.describe('prePopulateKyc', () => {
  test('prePopulateKyc — IDENTITY_CARD / MUNICIPALITY — ACCEPTED', async ({ partner }) => {
    await partner.prePopulateNewIndividual({ type: 'IDENTITY_CARD', releaseInstitution: 'MUNICIPALITY' });
  });

  test('prePopulateKyc — PASSPORT / POLICE_HEADQUARTER — ACCEPTED', async ({ partner }) => {
    await partner.prePopulateNewIndividual({ type: 'PASSPORT', releaseInstitution: 'POLICE_HEADQUARTER' });
  });

  test('prePopulateKyc — DRIVING_LICENSE / MCTC — ACCEPTED', async ({ partner }) => {
    await partner.prePopulateNewIndividual({ type: 'DRIVING_LICENSE', releaseInstitution: 'MCTC' });
  });

  test('prePopulateKyc — 2 individuals — each link → OTP → registration form pre-filled', async ({ partner }) => {
    await partner.prePopulateTwoAndOpenLinks();
  });

  test('prePopulateKyc — 50 individuals in one call (limit) — all ACCEPTED', async ({ partner }) => {
    await partner.prePopulateMaxBatch();
  });

  test('prePopulateKyc — same fiscalCode again — UPDATED (idempotent)', async ({ partner }) => {
    await partner.prePopulateSameFiscalCode();
  });
});
