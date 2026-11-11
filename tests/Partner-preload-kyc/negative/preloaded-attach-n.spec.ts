import { test } from '../../../utils/partnerFixture';

/**
 * KI-456 — attach (§1.6) და გამოყენებული ლინკი, ნეგატიური ქეისები (ფრონტის გაიდი §1.6, §5).
 * ასერტები: utils/PartnerApi.ts, utils/PreloadFlowHelper.ts
 */
test.describe('Pre-loaded onboarding — attach (negative)', () => {
  test('attach — link of another account (other mobile) → 400 / 3214', async ({ partner }) => {
    await partner.attachOtherAccountLink();
  });

  test('attach — same link twice → 404 / 3212', async ({ partner }) => {
    await partner.attachSameLinkTwice();
  });

  test('attach — invalid ref → 404 / 3212', async ({ partner }) => {
    await partner.attachInvalidRef();
  });

  test('attach — without token → 401', async ({ partner }) => {
    await partner.attachWithoutToken();
  });

  test('attach — verification already started (KYC page saved) → 409 / 3215', async ({ preload }) => {
    await preload.attachAfterVerificationStarted();
  });

  test('open — link already used for registration → 404 / 3212', async ({ partner }) => {
    await partner.openUsedLink();
  });
});
