import { test } from '../../../utils/portalFixture';

/**
 * Update merchant balance — negative (KI-432), web portal.
 * ყოველ ქეისში ბალანსი ტრანსფერამდე და შემდეგ იგივე უნდა იყოს (ფული არ გადადის).
 * flow + ასერტები: utils/MerchantBalanceFlow.ts
 */
test.describe('Update merchant balance — negative', () => {
  test('Personal → Technical transfer — empty amount', async ({ balance }) => {
    await balance.invalidAmount('Business', '', 'Enter an amount greater than €0.00.');
  });

  test('Personal → Technical transfer — amount 0', async ({ balance }) => {
    await balance.invalidAmount('Business', '0', 'Enter an amount greater than €0.00.');
  });

  test('Personal → Technical transfer — amount 0.001 (3 decimals)', async ({ balance }) => {
    await balance.invalidAmount('Business', '0.001', 'Use at most two decimals.');
  });

  test('Personal → Technical transfer — letters in amount', async ({ balance }) => {
    await balance.lettersNotAccepted();
  });

  test('Personal → Technical transfer — amount more than balance', async ({ balance }) => {
    await balance.moreThanAvailable('Business');
  });

  test('Technical → Personal transfer — amount more than balance', async ({ balance }) => {
    await balance.moreThanAvailable('Operating');
  });

  test('Personal → Technical transfer — Back on OTP step', async ({ balance }) => {
    await balance.backBeforeConfirm('Business');
  });

  test('Technical → Personal transfer — Back on confirm step', async ({ balance }) => {
    await balance.backBeforeConfirm('Operating');
  });

  test('Personal → Technical transfer — wrong OTP', async ({ balance }) => {
    await balance.wrongOtp();
  });

  test('Personal → Technical transfer — wrong OTP, transfer starts again (KI-472)', async ({ balance }) => {
    await balance.wrongOtpRestartsTransfer();
  });
});
