import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 / KI-481 — pre-loaded onboarding პორტალში, ბოლომდე (UI).
 * 1. ახალი იუზერი: partner pre-load → ლინკი → OTP → შევსებული რეგისტრაცია → Verifica Email → KYC → Firma → liveness.
 * 2. დარეგისტრირებული იუზერი (§1.1 alreadyRegistered, §1.6 attach): ჩვეულებრივი რეგისტრაცია → ბრაუზერი დაიხურა →
 *    partner pre-load იმავე ნომერზე → ლინკი → "You already have a Keepz account" → Log in → attach → KYC → liveness.
 * ყოველ გვერდზე: partner-ის გაგზავნილი ↔ ფორმაში დახვედრილი.
 * ნელა სანახავად: STEP_DELAY=10000 npx playwright test preloaded-onboarding
 * flow + ასერტები: utils/PreloadFlowHelper.ts
 */
test.describe('Pre-loaded onboarding — portal', () => {
  test('new user — partner link — KYC pre-filled with partner data — onboarding to liveness', async ({ preload }) => {
    await preload.completePreloadedOnboarding();
  });

  // შესული იუზერი ლინკს იმავე ბრაუზერში ხსნის (KI-484) — ხელით
  test('registered user — partner link → login → attach — KYC pre-filled — onboarding to liveness', async ({ preload }) => {
    await preload.existingCustomerOnboarding();
  });
});
