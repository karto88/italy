import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — pre-loaded onboarding, partner API — negative (KeepzWalletService v2.5.0 §7.11).
 * მხოლოდ პროტოკოლში აღწერილი სტატუს კოდები: auth (2475/2476/2478/2479), CLIENT_MISMATCH,
 * BATCH_SIZE_EXCEEDED, EXPIRED_DOCUMENT.
 * flow + ასერტები: utils/PartnerApi.ts
 */
test.describe('prePopulateKyc — negative', () => {
  test('auth — grant_type missing — 400 / 2475', async ({ partner }) => {
    await partner.authError({ grant_type: undefined }, 400, '2475');
  });

  test('auth — unsupported grant_type — 400 / 2476', async ({ partner }) => {
    await partner.authError({ grant_type: 'password' }, 400, '2476');
  });

  test('auth — client_secret missing — 401 / 2478', async ({ partner }) => {
    await partner.authError({ client_secret: undefined }, 401, '2478');
  });

  test('auth — wrong client_secret — 401 / 2479', async ({ partner }) => {
    await partner.authError({ client_secret: 'wrong-secret' }, 401, '2479');
  });

  test('prePopulateKyc — clientId differs from token — 403 / CLIENT_MISMATCH', async ({ partner }) => {
    await partner.clientMismatch();
  });

  test('prePopulateKyc — 51 individuals — 413 / BATCH_SIZE_EXCEEDED', async ({ partner }) => {
    await partner.batchSizeExceeded();
  });

  test('prePopulateKyc — expired document — REJECTED / EXPIRED_DOCUMENT', async ({ partner }) => {
    await partner.expiredDocument();
  });

  // fiscalCode
  test('prePopulateKyc — invalid fiscalCode — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('fiscalCodeInvalid');
  });

  test('prePopulateKyc — fiscalCode wrong check letter — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('fiscalCodeBadChecksum');
  });

  test('prePopulateKyc — empty fiscalCode — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('fiscalCodeEmpty');
  });

  // document type / addresses / documents
  test('prePopulateKyc — invalid document type — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('documentTypeInvalid');
  });

  test('prePopulateKyc — empty document type — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('documentTypeEmpty');
  });

  test('prePopulateKyc — empty addresses — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('addressesEmpty');
  });

  test('prePopulateKyc — empty documents — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('documentsEmpty');
  });

  // releaseInstitution
  test('prePopulateKyc — invalid releaseInstitution — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('releaseInstitutionInvalid');
  });

  test('prePopulateKyc — empty releaseInstitution — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('releaseInstitutionEmpty');
  });

  // mobile
  test('prePopulateKyc — empty mobile — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('mobileEmpty');
  });

  test('prePopulateKyc — non-Italian mobile (7 digits) — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('mobileNotItalian');
  });

  // provCode
  test('prePopulateKyc — invalid birth provCode — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('birthProvCodeInvalid');
  });

  test('prePopulateKyc — invalid address provCode — REJECTED', async ({ partner }) => {
    await partner.rejectedIndividual('addressProvCodeInvalid');
  });
});
