import { test } from '../../../utils/portalFixture';

/**
 * Update merchant balance — positive (KI-432), web portal.
 * თანხები წყვილებშია (B→C და C→B ერთნაირი), ბალანსი ბოლოს იგივე რჩება.
 * flow + ასერტები: utils/MerchantBalanceFlow.ts
 */
test.describe('Update merchant balance — positive', () => {
  test('Personal → Technical transfer — amount 1.00 (OTP by email)', async ({ balance }) => {
    await balance.businessToOperating('1.00');
  });

  test('Technical → Personal transfer — amount 1.00 (no OTP)', async ({ balance }) => {
    await balance.operatingToBusiness('1.00');
  });

  test('Personal → Technical transfer — amount 0.55 (OTP by email)', async ({ balance }) => {
    await balance.businessToOperating('0.55');
  });

  test('Technical → Personal transfer — amount 0.55 (no OTP)', async ({ balance }) => {
    await balance.operatingToBusiness('0.55');
  });

  test('Technical → Personal transfer — Whole balance fills the full amount', async ({ balance }) => {
    await balance.wholeBalance();
  });
});
