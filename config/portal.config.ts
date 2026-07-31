/**
 * ITALY პორტალის კონფიგურაცია — ყველა URL და route ერთ ადგილას
 */

export const PORTAL = {
  BASE_URL: process.env.BASE_URL || 'https://dev.portal.keepz.it',

  ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    // TODO: დაზუსტდეს რეალურ პორტალზე ნავიგაციის შემდეგ
    KYC: '/kyc',
    KYB: '/kyb',
    DASHBOARD: '/dashboard',
  },
};

/**
 * სატესტო მონაცემები — dynamic მონაცემები .env-იდან, არასდროს hardcode.
 */
export const TEST_DATA = {
  phone: process.env.TEST_PHONE || '34004011',
  countryCode: process.env.TEST_COUNTRY_CODE || '39',
  email: process.env.TEST_EMAIL || '',
  password: process.env.TEST_PASSWORD || 'Test@1234',
  otp: process.env.TEST_OTP || '111111',

  // KYC — ფიზიკური პირი
  kyc: {
    firstName: process.env.KYC_FIRST_NAME || 'Piert',
    lastName: process.env.KYC_LAST_NAME || 'Parker',
    email: process.env.KYC_EMAIL || 'd.kartozia@keepz.me',
  },

  // KYC ვერიფიკაცია — პირადი მონაცემების გვერდი (Italian, IT resident სატესტო ქეისი)
  kycPersonal: {
    gender: 'M',
    birthDate: '22051988', // ddmmyyyy → 22/05/1988
    nationality: 'Italia',
    provinceOfBirth: 'Agrigento',
    municipalityOfBirth: 'Agrigento',
    countryOfResidence: 'Italia',
    provinceOfResidence: 'Alessandria',
    municipalityOfResidence: 'Acqui Terme',
    street: 'Via Roma',
    streetNumber: '10',
    cap: '15011', // Acqui Terme, 5 ციფრი (valid: min 4, max 10)
    citizenship: 'Italia',
    fiscalCountryAML: 'Italia',
  },

  // KYC ვერიფიკაცია — დოკუმენტის გვერდი (Carta d'Identità სატესტო ქეისი)
  kycDocument: {
    documentType: 'Carta d’Identità', // ასევე: 'Patente', 'Passaporto'
    documentNumber: '4353434',
    issueDate: '11042025', // ddmmyyyy → 11/04/2025
    expiryDate: '11052027', // ddmmyyyy → 11/05/2027
    issuePlace: 'Roma',
    issuingAuthority: 'Police Headquarter', // ასევე: MCTC, Italian Representation Abroad, Ministry
  },

  // KYC ვერიფიკაცია — AML კითხვარი (Questionario Antiriciclaggio)
  kycFinancial: {
    // checkbox-ები (უნიკალური accessible names)
    scopo: 'Accredito stipendio/pensione', // Scopo del rapporto
    incomeOrigin: 'Reddito da libera professione / lavoro autonomo / attività imprenditoriale svolta', // Origine del reddito
    patrimonyOrigin: 'Reddito da lavoro autonomo / attività imprenditoriale svolta', // Origine del patrimonio
    // dropdown-ები
    profession: 'Lavoratore dipendente', // Professione svolta (partial match)
    contractType: 'Tempo Determinato', // Tipologia di contratto
    annualIncome: '- 25.000 annui', // Reddito Annuo
    patrimony: '- 25.000', // Patrimonio
    corporateRoles: 'No', // Cariche societarie in...
  },

  kyb: {
    companyName: process.env.KYB_COMPANY_NAME || '',
    vatNumber: process.env.KYB_VAT_NUMBER || '',
    registrationNumber: process.env.KYB_REGISTRATION_NUMBER || '',
  },
};
