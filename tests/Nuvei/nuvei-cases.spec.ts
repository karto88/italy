import { test } from '../../utils/nuveiFixture';

/**
 * Nuvei (POS) KYB onboarding — ვარიაციები (43 ტესტი).
 * flow: utils/NuveiFlowHelper.ts | setup: utils/nuveiFixture.ts
 * Tipo di UBO: CEO / CFO / COO / Share Holder / Board Member
 * Tipo di documento: Id / Passport / Driving Licence / Visa / Utility Bill /
 *                    Mortgage Statement / Rental Lease Agreement / Other
 */

// --- Company type (Tipo di società) ---
test.describe('Nuvei (POS) — Company type', () => {

  test('Nuvei onboarding — Private Company', async ({ flow }) => {
    await flow.completeOnboarding({ companyType: 'Private Company' });
  });

  test('Nuvei onboarding — Public Company', async ({ flow }) => {
    await flow.completeOnboarding({ companyType: 'Public Company' });
  });

  test('Nuvei onboarding — Non Profit', async ({ flow }) => {
    await flow.completeOnboarding({ companyType: 'Non Profit' });
  });
});

// --- UBO type × Document type (მოქალაქეობა Italia) ---
test.describe('Nuvei  — UBO type - document (citizenship Italia)', () => {

  // ===== CEO =====
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded ID document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Id', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Passport document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Passport', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Driving licence document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Driving Licence', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Visa document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Visa', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Utility Bill document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Utility Bill', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Mortgage Statement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Mortgage Statement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Rental Lease Agreement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Rental Lease Agreement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CEO - citizenship Italia - uploaded Other document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CEO', docType: 'Other', nationality: 'Italia' });
  });

  // ===== CFO =====
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded ID document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Id', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Passport document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Passport', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Driving licence document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Driving Licence', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Visa document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Visa', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Utility Bill document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Utility Bill', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Mortgage Statement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Mortgage Statement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Rental Lease Agreement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Rental Lease Agreement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is CFO - citizenship Italia - uploaded Other document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'CFO', docType: 'Other', nationality: 'Italia' });
  });

  // ===== COO =====
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded ID document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Id', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Passport document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Passport', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Driving licence document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Driving Licence', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Visa document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Visa', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Utility Bill document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Utility Bill', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Mortgage Statement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Mortgage Statement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Rental Lease Agreement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Rental Lease Agreement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is COO - citizenship Italia - uploaded Other document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'COO', docType: 'Other', nationality: 'Italia' });
  });

  // ===== Share Holder =====
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded ID document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Id', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Passport document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Passport', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Driving licence document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Driving Licence', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Visa document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Visa', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Utility Bill document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Utility Bill', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Mortgage Statement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Mortgage Statement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Rental Lease Agreement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Rental Lease Agreement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Share Holder - citizenship Italia - uploaded Other document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Share Holder', docType: 'Other', nationality: 'Italia' });
  });

  // ===== Board Member =====
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded ID document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Id', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Passport document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Passport', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Driving licence document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Driving Licence', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Visa document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Visa', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Utility Bill document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Utility Bill', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Mortgage Statement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Mortgage Statement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Rental Lease Agreement document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Rental Lease Agreement', nationality: 'Italia' });
  });
  test('Nuvei onboarding - when user is Board Member - citizenship Italia - uploaded Other document', async ({ flow }) => {
    await flow.completeOnboarding({ uboType: 'Board Member', docType: 'Other', nationality: 'Italia' });
  });
});