import { test } from '../../utils/businessFixture';

/**
 * User existence check — Business (KI-173).
 * KYB Firma-მდე (TPPay დოკუმენტს ხელს არ ვაწერთ) → Ricomincia → თავიდან, ერთი კოდის შეცვლით.
 * TPPay ბიზნესს კომპანიის Codice Fiscale-ით ცნობს: იგივე კოდი → 3116 "Processo già avviato per l'utente".
 * flow: utils/WalletFlowHelper.ts (userExistenceCheck)
 */
test.describe('User existence check — Business', () => {
  test('Rappresentante CF changed, same company CF — 3116', async ({ flow }) => {
    await flow.userExistenceCheck('personCf', 'blocked');
  });

  test('company CF changed — passes', async ({ flow }) => {
    await flow.userExistenceCheck('companyCf', 'passed');
  });
});
