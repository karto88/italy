import { test } from '../../../utils/gamingFixture';
import { GAMING_COMPANIES } from '../../../config/gaming.config';

/**
 * KI-395 / KI-396 / KI-398 — Gaming company ↔ მერჩანტი (API).
 * ადმინი: კომპანიის სტატუსი (PUT /api/v1/gaming-company/{id}) და მერჩანტზე მინიჭება (PUT /api/v1/merchant/update),
 * მერჩანტი: Cash In / Cash Out picker (GET /api/tppay-admin/gaming-companies) — მხოლოდ მინიჭებული ACTIVE კომპანიები.
 * ბოლოს: სტატუსი → ACTIVE, მერჩანტი → Serve all.
 */
const { gamingKo, kochana, lotomatica } = GAMING_COMPANIES;

test.describe('Gaming company status — merchant picker', () => {

  test('INACTIVE — company hidden in picker', async ({ gaming }) => {
    await gaming.companyStatusInPicker(gamingKo, 'INACTIVE');
  });

  test('TEMPORARILY_UNAVAILABLE — company hidden in picker', async ({ gaming }) => {
    await gaming.companyStatusInPicker(gamingKo, 'TEMPORARILY_UNAVAILABLE');
  });

  test('ACTIVE — company visible in picker', async ({ gaming }) => {
    await gaming.companyStatusInPicker(gamingKo, 'ACTIVE');
  });
});

test.describe('Gaming company assignment — merchant picker', () => {

  test('Select all gaming companies', async ({ gaming }) => {
    await gaming.assignAllCompanies();
  });

  test('Select several — kochana + LOTOMATICA', async ({ gaming }) => {
    await gaming.assignCompanies([kochana.id, lotomatica.id]);
  });
});
