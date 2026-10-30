import { test } from '../../utils/kycFixture';

/**
 * User existence check — Individual (KI-173).
 * KYC Firma-მდე (TPPay დოკუმენტს ხელს არ ვაწერთ) → Ricomincia → თავიდან.
 * TPPay იუზერს Codice Fiscale-ით ცნობს: იგივე კოდი → 3116 "Processo già avviato per l'utente".
 * flow: utils/KycFlowHelper.ts (userExistenceCheck)
 */
test.describe('User existence check — Individual', () => {
  test('same CF — 3116', async ({ flow }) => {
    await flow.userExistenceCheck('none', 'blocked');
  });

  test('CF changed — passes', async ({ flow }) => {
    await flow.userExistenceCheck('personCf', 'passed');
  });
});
