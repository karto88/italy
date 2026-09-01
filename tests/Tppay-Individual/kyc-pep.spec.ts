import { test } from '../../utils/kycFixture';
import { TEST_DATA } from '../../config/portal.config';

/**
 * KYC Onboarding — Individual · PEP ვარიაციები.
 * "Rapporti con PEP" ოთხივე არჩევანი (declared → Tipo di incarico + Nazione + Status).
 * flow: utils/KycFlowHelper.ts | setup+cleanup: utils/kycFixture.ts
 */
test.describe('KYC Onboarding — Individual · PEP', () => {

  test('Individual IS NO PEP', async ({ flow }) => {
    await flow.completeOnboarding({ pep: TEST_DATA.pep.none, sign: true });
  });

  test('PEP: Persona politica esposta - is a PEP', async ({ flow }) => {
    await flow.completeOnboarding({ pep: TEST_DATA.pep.self, sign: true });
  });

  test('PEP - Familiare di una persona politica esposta', async ({ flow }) => {
    await flow.completeOnboarding({ pep: TEST_DATA.pep.family, sign: true });
  });

  test('PEP - Legami in affari con una persona politicamente esposta', async ({ flow }) => {
    await flow.completeOnboarding({ pep: TEST_DATA.pep.business, sign: true });
  });
});