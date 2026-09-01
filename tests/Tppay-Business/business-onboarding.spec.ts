import { test } from '../../utils/businessFixture';
import { TEST_DATA } from '../../config/portal.config';

/**
 * KYB Onboarding — Business · Tppay (Wallet).
 * საერთო რეგისტრაცია + Yousign ხელმოწერა → Wallet არჩევა → KYB wizard.
 * ვარიაციები PEP სტატუსზე: No + 3 PEP × {დამთავრებული incarico, მიმდინარე incarico}.
 * flow: utils/WalletFlowHelper.ts | setup: utils/businessFixture.ts
 */
const PEP = TEST_DATA.walletKyb.pep;

test.describe('KYB Onboarding — Business · Tppay (Wallet)', () => {

  // PEP status: "No" (nessuna esposizione politica) → LIVENESS
  test('PEP: No', async ({ flow }) => {
    await flow.completeOnboarding();
  });

  // ── PEP — დამთავრებული incarico (endDate) ──

  test('PEP: Persona politica esposta (incarico terminato)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.self });
  });

  test('PEP: Familiare di una persona politica esposta (incarico terminato)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.family });
  });

  test('PEP: Legami in affari con una persona politicamente esposta (incarico terminato)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.business });
  });

  // ── PEP — მიმდინარე incarico (ancora in corso) ──

  test('PEP: Persona politica esposta (in corso)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.selfOngoing });
  });

  test('PEP: Familiare di una persona politica esposta (in corso)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.familyOngoing });
  });

  test('PEP: Legami in affari con una persona politicamente esposta (in corso)', async ({ flow }) => {
    await flow.completeOnboarding({ pep: PEP.businessOngoing });
  });
});