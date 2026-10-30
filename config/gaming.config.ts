/**
 * Gaming კომპანიები (DEV) — admin id + picker-ში ნაჩვენები სახელი.
 * კომპანია ტესტ-მერჩანტზე (MERCHANT_* .env-ში) უკვე მინიჭებული უნდა იყოს.
 */
export const GAMING_COMPANIES = {
  gamingKo: { id: 10, name: 'Gaming KO KARTOZIA' },
  kochana: { id: 11, name: 'kochana bregvadze' },
  lotomatica: { id: 3, name: 'LOTOMATICA' },
  /** არარსებული კომპანია — ნეგატიური ქეისისთვის (1402) */
  unknownId: 99999,
};

/** მერჩანტის საწყისი gamingAccess — ტესტის ბოლოს ამაზე ბრუნდება */
export const DEFAULT_GAMING_ACCESS = { serveAll: true };

/**
 * merchantData = ადმინის Business Edit → Save-ის payload (merchant/update, part merchantData).
 * ტესტი მხოლოდ gamingAccess-ს ცვლის.
 */
export const GAMING_MERCHANT_DATA = {
  merchantGroupId: { value: '353', label: 'Italy Default Wallet DNT' },
  personalNumber: '30664295394',
  email: 'keepztest4@mailinator.com',
  name: 'Adriatica 295394 SRL',
  databaseId: '1a614d6a-b16e-4344-9608-c97a11ef3ad5',
  status: 'ACTIVE',
  phoneNumber: '34004386',
  countryCode: '39',
  merchantType: 'MERCHANT',
  completionDate: '2026-09-29T08:44:59',
  createdAt: '2026-09-29T08:45:00',
  masterBranchId: 'cb46dc72-e826-4ca0-b4b7-4c587032f736',
  isMock: false,
  merchantBranding: {
    headerColor: '#170738',
    buttonColor: '#6C63FF',
    buttonTextColor: '#FFFFFF',
    titleColor: '#FFFFFF',
  },
  verificationInfo: {
    tppay: { enabled: true, status: 'CONFIRMED', errorMessage: null, lastActionDate: '2026-09-30T10:52:30' },
    nuvei: { enabled: false, status: null, errorMessage: null, lastActionDate: null },
    keepz: { signingRequired: true, merchantSigned: true, signatureLink: null },
  },
  isActive: true,
  removeProfileImage: false,
  phoneNumberDetails: { phoneNumber: '34004386', countryCode: '39' },
  merchantId: '1a614d6a-b16e-4344-9608-c97a11ef3ad5',
  accountManagerId: '3',
  officialName: 'Mario',
  officialLastName: 'Rossi',
  generalVerificationStatus: 'VERIFIED',
};
