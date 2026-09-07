import { test } from '../../utils/businessFixture';
import { TEST_DATA } from '../../config/portal.config';

/**
 * KYB Onboarding — Business · Tppay (Wallet) · Documenti step.
 * Equivalence partitioning დოკუმენტის ტიპის მიხედვით — "Ente rilascio" (KI-175 mapping):
 *   Carta d'Identità / Patente / Permesso di soggiorno → 1 ვარიანტი (auto-fill, disabled)
 *   Passaporto → 2 ვარიანტი (Questura — იტალიაში გაცემული | Consolato — იტალიელი მოქალაქე საზღვარგარეთ)
 * flow: utils/WalletFlowHelper.ts (opts.documentType + opts.enteRilascio)
 */
const DOC = TEST_DATA.documentTypes;
const ENTE = TEST_DATA.enteRilascio;

test.describe('KYB Onboarding — Business · Tppay (Wallet) · Documenti (document type)', () => {

  test('Documenti — Carta dIdentita - Comune', async ({ flow }) => {
    await flow.completeOnboarding({ documentType: DOC.cartaIdentita });
  });

  test('Documenti — Patente  Motorizzazione Civile', async ({ flow }) => {
    await flow.completeOnboarding({ documentType: DOC.patente });
  });

  test('Documenti — Passaporto  Questura', async ({ flow }) => {
    await flow.completeOnboarding({ documentType: DOC.passaporto, enteRilascio: ENTE.passaportoItalia });
  });

  test('Documenti — Passaporto  Consolato Ambasciata', async ({ flow }) => {
    await flow.completeOnboarding({ documentType: DOC.passaporto, enteRilascio: ENTE.passaportoEstero });
  });

  test('Documenti — Permesso di soggiorno - Questura', async ({ flow }) => {
    await flow.completeOnboarding({ documentType: DOC.permessoSoggiorno });
  });
});
