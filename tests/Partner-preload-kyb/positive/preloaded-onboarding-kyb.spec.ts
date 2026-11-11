import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — pre-loaded onboarding პორტალში, merchant (KYB), ბოლომდე (UI).
 * partner prePopulateKyb → ლინკი (წარმომადგენლის CF) → OTP → შევსებული "Enter your business details" → email OTP →
 * რეგისტრაცია → Yousign → KYB: Azienda / Sede / Persone შევსებული → PEP → AML → Documenti → Firma → liveness.
 * ყოველ გვერდზე: partner-ის გაგზავნილი ↔ ფორმაში დახვედრილი.
 * ნელა სანახავად: STEP_DELAY=10000 npx playwright test preloaded-onboarding-kyb
 * flow + ასერტები: utils/PreloadKybFlowHelper.ts
 */
test.describe('Pre-loaded onboarding KYB — portal', () => {
  test('new merchant — partner link — KYB pre-filled with partner data — onboarding to liveness', async ({ preloadKyb }) => {
    await preloadKyb.completePreloadedKybOnboarding();
  });
});
