import { expect } from '@playwright/test';
import { AdminApi } from './AdminApi';
import { MerchantApi } from './MerchantApi';
import { GAMING_MERCHANT_DATA, DEFAULT_GAMING_ACCESS } from '../config/gaming.config';

/**
 * GamingAccessFlow — KI-395 / KI-396 / KI-398: ადმინი ცვლის gaming კომპანიის სტატუსს,
 * მერჩანტის Cash In / Cash Out picker-ში მხოლოდ ACTIVE კომპანია ჩანს.
 */
type CompanyStatus = 'ACTIVE' | 'TEMPORARILY_UNAVAILABLE' | 'INACTIVE';

export class GamingAccessFlow {
  /** შეიცვალა თუ არა მერჩანტის gamingAccess → ბოლოს საწყის არჩევანზე ბრუნდება */
  accessChanged = false;
  /** სტატუსშეცვლილი კომპანიები → ბოლოს ACTIVE-ზე ბრუნდება */
  private changedStatuses = new Set<number>();

  constructor(private admin: AdminApi, private merchant: MerchantApi) {}

  /**
   * კომპანიის სტატუსი ადმინიდან → მერჩანტის picker:
   * ACTIVE → კომპანია ჩანს; TEMPORARILY_UNAVAILABLE / INACTIVE → არ ჩანს.
   * (კომპანია მერჩანტზე უკვე მინიჭებული უნდა იყოს)
   */
  async companyStatusInPicker(company: { id: number; name: string }, status: CompanyStatus) {
    this.changedStatuses.add(company.id);
    const res = await this.admin.setGamingCompanyStatus(company.id, status);
    expect(res.status, `gaming-company/${company.id} → ${res.status}: ${res.body?.message}`).toBeLessThan(300);
    expect((await this.admin.getGamingCompany(company.id)).status).toBe(status);

    const picker = (await this.merchant.gamingCompanies()).map((c) => c.name);
    if (status === 'ACTIVE') expect(picker).toContain(company.name);
    else expect(picker).not.toContain(company.name);
    console.log(`✅ ${company.name} ${status} → picker (${picker.length}): ${picker.join(', ')}`);
  }

  /** შეცვლილი სტატუსების დაბრუნება ACTIVE-ზე */
  async restoreStatuses() {
    for (const id of this.changedStatuses) await this.admin.setGamingCompanyStatus(id, 'ACTIVE');
  }

  /**
   * მერჩანტზე კომპანიების მინიჭება → picker:
   * 1. GET gaming-company (სია) → არჩეული id-ები არსებობს
   * 2. PUT merchant/update — gamingAccess { serveAll: false, gamingCompanyIds }
   * 3. მერჩანტის picker = ზუსტად არჩეული ACTIVE კომპანიები
   */
  async assignCompanies(ids: number[]) {
    const companies = await this.admin.getGamingCompanies();
    const selected = ids.map((id) => companies.find((c) => c.id === id));
    selected.forEach((c, i) => expect(c, `gaming company id ${ids[i]} not found in the list`).toBeTruthy());

    this.accessChanged = true;
    const res = await this.admin.updateMerchant({
      ...GAMING_MERCHANT_DATA,
      gamingAccess: { serveAll: false, gamingCompanyIds: ids },
    });
    expect(res.status, `merchant/update → ${res.status}: ${res.body?.message}`).toBeLessThan(300);

    const expected = selected.filter((c) => !c.status || c.status === 'ACTIVE').map((c) => c.displayName).sort();
    const picker = (await this.merchant.gamingCompanies()).map((c) => c.name).sort();
    expect(picker).toEqual(expected);
    console.log(`✅ assigned [${ids}] → picker (${picker.length}): ${picker.join(', ')}`);
  }

  /**
   * Serve all Gaming Companies → picker:
   * 1. GET gaming-company (სია)
   * 2. PUT merchant/update — gamingAccess { serveAll: true }
   * 3. მერჩანტის picker = ყველა ACTIVE კომპანია (სტატუსი ACTIVE ან null)
   */
  async assignAllCompanies() {
    const companies = await this.admin.getGamingCompanies();

    this.accessChanged = true;
    const res = await this.admin.updateMerchant({ ...GAMING_MERCHANT_DATA, gamingAccess: { serveAll: true } });
    expect(res.status, `merchant/update → ${res.status}: ${res.body?.message}`).toBeLessThan(300);

    const expected = companies.filter((c) => !c.status || c.status === 'ACTIVE').map((c) => c.displayName).sort();
    const picker = (await this.merchant.gamingCompanies()).map((c) => c.name).sort();
    expect(picker).toEqual(expected);
    console.log(`✅ serve all → picker (${picker.length}): ${picker.join(', ')}`);
  }

  /**
   * ნეგატიური: merchant/update არასწორი gamingAccess-ით → ერორი statusCode-ით.
   * ბექი update-ს უარყოფს, ამიტომ მერჩანტი არ იცვლება და restore არ გვჭირდება.
   * (თუ შემთხვევით გავიდა — accessChanged, რომ ბოლოს აღდგეს)
   */
  async expectAccessError(gamingAccess: Record<string, any>, statusCode: number) {
    const res = await this.admin.updateMerchant({ ...GAMING_MERCHANT_DATA, gamingAccess });
    if (res.status < 300) this.accessChanged = true;
    expect(res.body?.statusCode, `expected ${statusCode}, got ${res.status}: ${res.body?.message}`).toBe(statusCode);
    console.log(`✅ ${statusCode} — ${res.body?.message}`);
  }

  /** მერჩანტის საწყისი მდგომარეობის აღდგენა */
  async restoreAccess() {
    await this.admin.updateMerchant({ ...GAMING_MERCHANT_DATA, gamingAccess: DEFAULT_GAMING_ACCESS });
  }
}
