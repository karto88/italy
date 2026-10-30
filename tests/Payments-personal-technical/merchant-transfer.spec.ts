import { test } from '../../utils/paymentsFixture';

/**
 * KI-432 — გადარიცხვა მერჩანტის PERSONAL ↔ TECHNICAL ანგარიშებს შორის (API).
 *   PERSONAL → TECHNICAL: OTP საჭიროა
 *   TECHNICAL → PERSONAL: OTP-ის გარეშე
 * flow + ასერტები: utils/MerchantApi.ts
 */

// 💶 თანხები — აქ ჩაწერე რამდენი გადავიდეს
const PERSONAL_TO_TECHNICAL = 1.0;
const TECHNICAL_TO_PERSONAL = 1.0;

// 💶 ათწილადი თანხები
const PERSONAL_TO_TECHNICAL_DECIMAL = 1.5;
const TECHNICAL_TO_PERSONAL_DECIMAL = 1.5;

test.describe('transfer PERSONAL - TECHNICAL', () => {

  test('PERSONAL → TECHNICAL — OTP required', async ({ merchant }) => {
    await merchant.transferPersonalToTechnical(PERSONAL_TO_TECHNICAL);
  });

  test('TECHNICAL → PERSONAL — no OTP', async ({ merchant }) => {
    await merchant.transferTechnicalToPersonal(TECHNICAL_TO_PERSONAL);
  });

  test('PERSONAL → TECHNICAL — OTP required — decimal amount', async ({ merchant }) => {
    await merchant.transferPersonalToTechnical(PERSONAL_TO_TECHNICAL_DECIMAL);
  });

  test('TECHNICAL → PERSONAL — no OTP — decimal amount', async ({ merchant }) => {
    await merchant.transferTechnicalToPersonal(TECHNICAL_TO_PERSONAL_DECIMAL);
  });
});
