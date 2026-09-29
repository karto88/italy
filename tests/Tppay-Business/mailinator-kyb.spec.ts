import { test } from '../../utils/businessFixture';
import { uniqueMailinatorEmail } from '../../utils/randomData';

/**
 * KYB onboarding — mailinator.com testing email (keepztest{N}@mailinator.com).
 * პირადი Gmail-ის მაგივრად — public inbox, სხვისთვის credential-ების გადასაცემად.
 * ⚠️ ყოველ run-ზე ახალი inbox (uniqueMailinatorEmail) — იგივე მისამართის ხელახლა
 * გამოყენება stale OTP-ს/already-registered account-ს იწვევს.
 * OTP: MailinatorHelper (utils/MailinatorHelper.ts) — HTTP public API, auth არ სჭირდება.
 */
test('KYB onboarding — mailinator test account', async ({ flow }) => {
  const email = uniqueMailinatorEmail();
  console.log('📧 mailinator email:', email);
  await flow.completeOnboarding({ email });
});
