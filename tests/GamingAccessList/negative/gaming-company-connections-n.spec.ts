import { test } from '../../../utils/gamingFixture';
import { GAMING_COMPANIES } from '../../../config/gaming.config';

/**
 * KI-398 — Gaming Company access: ნეგატიური ქეისები (API).
 * PUT /api/v1/merchant/update არასწორი gamingAccess-ით → ერორი (KI-398 frontend guide §1.5).
 * ბექი update-ს უარყოფს — მერჩანტის კავშირები არ იცვლება.
 */
const { kochana, unknownId } = GAMING_COMPANIES;

test.describe('Gaming Company access — negative', () => {

  test('2182 — Serve all together with selected companies', async ({ gaming }) => {
    await gaming.expectAccessError({ serveAll: true, gamingCompanyIds: [kochana.id] }, 2182);
  });

  test('2183 — Serve selected with no company', async ({ gaming }) => {
    await gaming.expectAccessError({ serveAll: false, gamingCompanyIds: [] }, 2183);
  });

  test('1402 — unknown gaming company', async ({ gaming }) => {
    await gaming.expectAccessError({ serveAll: false, gamingCompanyIds: [unknownId] }, 1402);
  });
});
