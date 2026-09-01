import { test } from '../../utils/kycFixture';
import { TEST_DATA } from '../../config/portal.config';

/**
 * TPPay Onboarding — Individual cases ("only TPPay cases").
 * checklist: docs/tppay-onboarding.md (TC0.2–TC0.11).
 * flow: utils/KycFlowHelper.ts | setup: utils/kycFixture.ts
 */
const DOC = TEST_DATA.documentTypes;

test.describe('TPPay Onboarding — Individual cases', () => {

  // TC0.2 — valid CIE (Electronic Identity Card) → CONFIRMED
  test('TC0.2 — valid CIE identity card', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.cartaIdentita }, sign: true });
  });

  // TC0.3 — valid paper identity card → CONFIRMED (dropdown იგივე)
  test('TC0.3 — valid paper identity card', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.cartaIdentita }, sign: true });
  });

  // TC0.4 — valid driving license → CONFIRMED
  test('TC0.4 — valid driving license', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.patente }, sign: true });
  });

  // TC0.5 — valid passport → CONFIRMED
  test('TC0.5 — valid passport', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.passaporto }, sign: true });
  });

  // TC0.6 — non-EU citizenship (Georgia) + residence permit → CONFIRMED
  // დოკუმენტი კონკრეტული არაა → Carta d'Identità (passport ცალკე TC0.5-შია)
  test('TC0.6 — non-EU citizenship and residence permit', async ({ flow }) => {
    await flow.completeOnboarding({
      document: { documentType: DOC.cartaIdentita },
      // non-EU: დაბადებაც საქართველო + მოქალაქეობა Georgia → città + residence permit
      personal: { nationality: 'Georgia', municipalityOfBirth: 'Tbilisi', citizenship: 'Georgia' },
      sign: true,
    });
  });

  // TC0.7 — declared details differ from document → KYC negativo
  // TODO: personal data ≠ document → negative outcome
  test.fixme('TC0.7 — declared details differ from document', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.cartaIdentita }, sign: true });
  });

  // TC0.8 + TC0.9 — ერთი end-to-end სცენარი:
  //   TC0.8: front ფოტო ორივე სლოტში → KYC negativo / missing data
  //   TC0.9: იმავე იუზერი → სწორ front+back (data-update) → positivo
  // TODO: დოკუმენტის სურათების ატვირთვა (front/back) — API/liveness დონე
  test.fixme('TC0.8 and TC00.9 — wrong front-only upload - fix with correct images', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.cartaIdentita }, sign: true });
  });

  // TC0.10 — driving license + declaring PEP status → CONFIRMED
  test('TC0.10 — driving license and PEP declared', async ({ flow }) => {
    await flow.completeOnboarding({
      document: { documentType: DOC.patente },
      pep: TEST_DATA.pep.self,
      sign: true,
    });
  });

  // TC0.11 — driving license, WITHOUT final contract signature → KO (account not opened, expires 30d)
  // TODO: sign გარეშე + status assert (არა-LIVENESS)
  test.fixme('TC0.11 — no final signature', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: DOC.patente }, sign: false });
  });
});