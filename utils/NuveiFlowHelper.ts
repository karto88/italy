import { Page, expect } from '@playwright/test';
import { BusinessFlowHelper } from './BusinessFlowHelper';
import { NuveiKybPage } from '../pages/NuveiKybPage';
import { uniqueRegNumber } from './randomData';
import { TEST_DATA } from '../config/portal.config';

/**
 * NuveiFlowHelper — Nuvei (POS) სრული KYB onboarding.
 * register + sign (BusinessFlowHelper) → Digital POS → KYB wizard → Close → IN_PROGRESS.
 * ტესტი ერთ მეთოდს იძახებს: flow.completeOnboarding(opts).
 */
export class NuveiFlowHelper {
  private business: BusinessFlowHelper;
  private kyb: NuveiKybPage;

  constructor(private page: Page) {
    this.business = new BusinessFlowHelper(page);
    this.kyb = new NuveiKybPage(page);
  }

  get nuveiStatus() {
    return this.business.nuveiStatus;
  }

  /**
   * სრული Nuvei (POS) KYB onboarding.
   * opts: companyType (Tipo di società) · uboType (Tipo di UBO) ·
   *       docType (Tipo di documento) · docFile · nationality.
   */
  async completeOnboarding(
    opts: {
      companyType?: string;
      uboType?: string;
      docType?: string;
      docFile?: string;
      nationality?: string;
    } = {}
  ) {
    const n = TEST_DATA.nuveiKyb;

    await this.business.registerBusiness();
    await this.business.signAgreement();

    await this.kyb.chooseDigitalPos();
    await this.kyb.clickContinue();
    await this.kyb.clickVerify(); // tolerant (KI-225)
    await this.kyb.clickStartKyb();

    // Organization
    await this.kyb.fillOrganization({
      ...n,
      companyType: opts.companyType ?? n.companyType,
      registrationNumber: uniqueRegNumber(),
    });
    await this.kyb.clickAvanti();
    console.log(`✅ Organization (${opts.companyType ?? n.companyType})`);

    // Ubos + document
    await this.kyb.fillUbo({
      ...n.ubo,
      uboType: opts.uboType ?? n.ubo.uboType,
      nationality: opts.nationality ?? n.ubo.nationality,
    });
    await this.kyb.selectDocTypeAndUpload(
      opts.docType ?? n.ubo.docType,
      opts.docFile ?? n.ubo.documentFile
    );
    await this.kyb.clickAvanti();
    console.log(`✅ Ubos (${opts.uboType ?? n.ubo.uboType}, doc: ${opts.docType ?? n.ubo.docType})`);

    // Verification
    await this.kyb.uploadVerificationDoc(n.verificationFile);
    await this.kyb.clickAvanti();

    // Bank account (ბოლო)
    await this.kyb.fillBankAccount(n.bankAccount);
    await this.kyb.clickAvanti();
    console.log('✅ Bank account');

    // Close → nuvei status IN_PROGRESS
    await this.kyb.clickClose();
    await this.assertInProgress();
  }

  /** nuvei status IN_PROGRESS-ის დაცდა/ასერტი (profile/details → verificationInfo.nuvei.status) */
  private async assertInProgress() {
    const ok = () => /IN_PROGRESS|PROGRESS|PENDING/i.test(this.nuveiStatus || '');
    for (let i = 0; i < 40 && !ok(); i++) await this.page.waitForTimeout(500);
    if (!ok()) {
      await this.page.reload().catch(() => {});
      for (let i = 0; i < 20 && !ok(); i++) await this.page.waitForTimeout(500);
    }
    console.log('🎥 Nuvei status:', this.nuveiStatus);
    expect(
      this.nuveiStatus,
      `Nuvei status უნდა იყოს IN_PROGRESS, არის: ${this.nuveiStatus}`
    ).toMatch(/IN_PROGRESS|PROGRESS|PENDING/i);
    console.log(
      '🏆 Expected result: Merchant successfully passed verification and is waiting for confirmation from Nuvei'
    );
  }
}