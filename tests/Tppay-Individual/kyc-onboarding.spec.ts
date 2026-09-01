import { test } from '../../utils/kycFixture';

/**
 * KYC Onboarding — Individual (document type ვარიაციები).
 * flow-ის ლოგიკა: utils/KycFlowHelper.ts | setup+cleanup: utils/kycFixture.ts
 * PEP ვარიაციები: kyc-pep.spec.ts
 */
test.describe('KYC Onboarding — Individual', () => {
  test('onboarding with ID card -Individual', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Carta d’Identità' } });
  });

  test('onboarding with driver license - Individual', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Patente' } });
  });

  test('onboarding with passport - Individual', async ({ flow }) => {
    await flow.completeOnboarding({ document: { documentType: 'Passaporto' } });
  });
});