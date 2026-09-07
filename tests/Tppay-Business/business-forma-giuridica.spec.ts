import { test } from '../../utils/businessFixture';
import { TEST_DATA } from '../../config/portal.config';

/**
 * KYB Onboarding — Business · Tppay (Wallet) · Azienda step.
 * Equivalence partitioning "Forma Giuridica" dropdown-ის ყველა ვარიანტზე.
 * flow: utils/WalletFlowHelper.ts (opts.formaGiuridica)
 */
test.describe('KYB Onboarding — Business · Tppay (Wallet) · Forma Giuridica', () => {
  for (const forma of TEST_DATA.formaGiuridicaOptions) {
    test(`Forma Giuridica — ${forma}`, async ({ flow }) => {
      await flow.completeOnboarding({ formaGiuridica: forma });
    });
  }
});
