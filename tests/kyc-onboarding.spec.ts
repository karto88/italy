import { test } from '../utils/kycFixture';

/**
 * KYC Onboarding — Individual (ფიზიკური პირი).
 * flow-ის ლოგიკა: utils/KycFlowHelper.ts | setup+cleanup: utils/kycFixture.ts
 * negative/boundary roadmap: docs/kyc-verification-notes.md
 */
test.describe('KYC Onboarding — Individual', () => {
  test('onboarding with ID card', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Carta d’Identità' } });
  });

  test('onboarding with driver license', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Patente' } });
  });

  test('onboarding with passport', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Passaporto' } });
  });
});