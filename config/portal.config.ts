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
  password: process.env.TEST_PASSWORD || 'Keepz@1234',
  otp: process.env.TEST_OTP || '111111',

  // დოკუმენტის ტიპები (dropdown value-ები) — ტესტებში hardcode-ის ნაცვლად
  documentTypes: {
    cartaIdentita: 'Carta d’Identità',
    patente: 'Patente',
    passaporto: 'Passaporto',
  },

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
    // Cittadinanza ≠ Italia → permesso di soggiorno (PDF) — TC0.6
    residencePermitFile: 'fixtures/dummy_docs/3_visura_camerale_TEST.pdf',
  },

  // PEP — "Rapporti con PEP" ოთხი არჩევანი (KYC personal data)
  // declared (≠ No) → Tipo di incarico + Nazione incarico + Status incarico ჩნდება
  pep: {
    none: { relationship: 'No' },
    self: {
      relationship: 'Persona politica esposta',
      isPep: true,
      tipoIncarico: 'Sottosegretario',
      nazione: 'Italia',
      status: 'inprogress',
    },
    family: {
      relationship: 'Familiare di una persona politica esposta',
      isPep: true, // "Sei una PEP?" → ხსნის Tipo di incarico (პოზიცია)
      tipoIncarico: 'Sottosegretario',
      nazione: 'Italia',
      status: 'inprogress',
    },
    business: {
      relationship: 'Legami in affari con una persona politicamente esposta',
      isPep: true, // "Sei una PEP?" → ხსნის Tipo di incarico (პოზიცია)
      tipoIncarico: 'Sottosegretario',
      nazione: 'Italia',
      status: 'inprogress',
    },
  },

  // Tppay Business (KYB) რეგისტრაცია
  business: {
    companyName: 'Test Company SRL',
    signerName: 'Mario', // შეიძლება random-ით
    signerSurname: 'Rossi',
    companyTaxCode: '12345678903', // ⚠️ format validation რეალურია — დაზუსტდეს
    password: 'Keepz@1234',
    emailBase: 'keepz1000', // Mailinator base inbox
  },

  // Tppay (Wallet) — KYB wizard Organization step (static ველები; P.IVA/REA უნიკალური ტესტში)
  walletKyb: {
    formaGiuridica: 'SRL', // ვარიანტები: SS (Società semplice) / SNC / SAS / SRL / SRLS / SPA
    codiceSAE: '430',
    codiceATECO: '702209',
    provinciaIscrizione: '74646433',
    dataIscrizione: '08032025', // 08/03/2025
    // legal address ქვე-ბიჯი
    street: 'Via Roma',
    houseNumber: '10',
    zipcode: '00184', // 4-10 ციფრი
    country: 'Italia',
    provincia: 'Agrigento',
    citta: 'Agrigento',
    // Persone — Rappresentante legale (Nome/Cognome pre-filled, არ ვავსებთ)
    rappresentante: {
      birthDate: '15061985', // ddmmyyyy → წელი <2000 (ვალიდაცია — negative ქეისებში)
      sesso: 'F', // Sesso: M | F
      phone: '3401234567', // 10 ციფრი
      paese: 'Italia', // Paese (di nascita)
      provinciaNascita: 'Agrigento',
      cittaNascita: 'Agrigento',
      // Residenza
      indirizzo: 'Via Roma',
      numero: '10',
      cap: '00184',
      paeseResidenza: 'Italia',
      provinciaResidenza: 'Agrigento',
      cittaResidenza: 'Agrigento',
      // AML / Cittadinanza
      paeseFiscaleAML: 'Italia',
      cittadinanza: 'Italia', // ≠ Italia → residency doc (Carica documenti) სავალდებულო
    },
    // TE (Titolare Effettivo) — მე-2 პიროვნება (TC0.14+, multi-person)
    te: {
      name: 'Luca',
      surname: 'Bianchi',
      birthDate: '18091985', // <2000
      sesso: 'M',
      email: '', // ცარიელი → უნიკალური email flow-ში ჩაისმება
      phone: '3402223344',
      paese: 'Italia',
      provinciaNascita: 'Agrigento',
      cittaNascita: 'Agrigento',
      indirizzo: 'Via Milano',
      numero: '12',
      cap: '00185',
      paeseResidenza: 'Italia',
      provinciaResidenza: 'Agrigento',
      cittaResidenza: 'Agrigento',
      paeseFiscaleAML: 'Italia',
      cittadinanza: 'Italia',
      // TE = ბიზნეს ოუნერი → მხოლოდ Titolare effettivo
      roles: { titolare: true, firmatario: false },
    },
    // PEP step (Verifica PEP) — per-person; id-ები: 4.members.{i}.amlPep*
    // happy-path: No PEP. PEP-yes → Dettagli PEP (type/country/startDate + endDate ან ongoing).
    pep: {
      none: { relationship: 'No' },
      // ── დამთავრებული incarico (endDate, ongoing:false) ──
      // PEP თავად (Persona politica esposta)
      self: {
        relationship: 'Persona politica esposta',
        type: 'Ministro', // amlPepType dropdown-იდან
        country: 'Italia',
        startDate: '01012019',
        endDate: '01012022',
        ongoing: false,
      },
      // ოჯახის წევრი PEP
      family: {
        relationship: 'Familiare di una persona politica esposta',
        type: 'Ministro',
        country: 'Italia',
        startDate: '01012019',
        endDate: '01012022',
        ongoing: false,
      },
      // საქმიანი კავშირი PEP-თან
      business: {
        relationship: 'Legami in affari con una persona politicamente esposta',
        type: 'Ministro',
        country: 'Italia',
        startDate: '01012019',
        endDate: '01012022',
        ongoing: false,
      },
      // ── მიმდინარე incarico (ancora in corso, ongoing:true → endDate არ საჭიროებს) ──
      selfOngoing: {
        relationship: 'Persona politica esposta',
        type: 'Ministro',
        country: 'Italia',
        startDate: '01012019',
        ongoing: true,
      },
      familyOngoing: {
        relationship: 'Familiare di una persona politica esposta',
        type: 'Ministro',
        country: 'Italia',
        startDate: '01012019',
        ongoing: true,
      },
      businessOngoing: {
        relationship: 'Legami in affari con una persona politicamente esposta',
        type: 'Ministro',
        country: 'Italia',
        startDate: '01012019',
        ongoing: true,
      },
    },
    w9File: 'fixtures/dummy_docs/3_visura_camerale_TEST.pdf', // US taxpayer (W9) doc — Sono contribuente USA
    // AML step (business) — Questionario Antiriciclaggio
    aml: {
      activities: ['Gestione della tesoreria', 'Finanziamenti da soci', 'Pagamento dipendenti'],
      nazioneGeografica: 'Italia',
      regionePrincipale: 'Abruzzo',
      ricaviAnnui: '200.000 euro annui', // option: "– 200.000 euro annui" (partial)
      patrimonio: '500.000 euro', // option: "– 500.000 euro" (partial)
      // numeroDipendenti: მითითების გარეშე — პირველი option
    },
    // Documenti step — Visura Camerale (company PDF) + პიროვნების დოკუმენტი
    documenti: {
      companyFile: 'fixtures/dummy_docs/3_visura_camerale_TEST.pdf', // Visura Camerale (PDF, max 5MB)
      tipoDocumento: 'Carta d’Identità', // Carta d'Identità | Patente | Passaporto
      personFile: 'fixtures/dummy_docs/16a_cid_Romano_ES_TEST.png', // ID სურათი — fronte (JPG/PNG/JPEG)
      // Carta d'Identità → ზუსტად 2 ფაილი (fronte + retro); Patente/Passaporto → 1
      personFileBack: 'fixtures/dummy_docs/16d_cid_Conti_TE3_TEST.png', // retro
      numeroDocumento: '4353434',
      dataRilascio: '12052025', // 12/05/2025
      dataScadenza: '12052027', // 12/05/2027
      enteRilascio: 'Police Headquarter', // Municipality | MCTC | Italian Representation Abroad | Ministry | Police Headquarter
      luogoRilascio: 'Roma', // Luogo di rilascio
    },
  },

  // Nuvei (POS) — KYB wizard Organization step
  nuveiKyb: {
    // ვარიაციები ტესტებისთვის (dropdown-ის სრული სიები)
    companyTypes: ['Private Company', 'Public Company', 'Non Profit'],
    uboTypes: ['CEO', 'CFO', 'COO', 'Share Holder', 'Board Member'],
    // docType = checkbox id suffix (2.members.0.documentType-{type}) = radio label
    docTypes: [
      { type: 'Id', label: 'ID' },
      { type: 'Passport', label: 'Passport' },
      { type: 'Driving Licence', label: 'Driving licence' },
      { type: 'Visa', label: 'Visa' },
      { type: 'Utility Bill', label: 'Utility Bill' },
      { type: 'Mortgage Statement', label: 'Mortgage Statement' },
      { type: 'Rental Lease Agreement', label: 'Rental Lease Agreement' },
      { type: 'Other', label: 'Other' },
    ],
    companyType: 'Private Company', // ასევე: Public Company, Non Profit
    registrationNumber: '423422', // 6 ციფრი (შეიძლება შეიცვალოს)
    street: 'Via Roma',
    city: 'Roma',
    houseNumber: '10',
    cap: '00184',
    country: 'Italia',
    // Ubos step — beneficial owner
    ubo: {
      firstName: 'Mario',
      lastName: 'Rossi',
      nationality: 'Italia',
      birthDate: '25051988', // 25/05/1988
      country: 'Italia',
      uboType: 'CEO',
      docType: 'Id', // Tipo di documento: Id | Passport | Driving Licence | ...
      documentFile: 'fixtures/dummy_docs/16a_cid_Romano_ES_TEST.png', // ID სურათი (PNG)
    },
    // Verification step — company doc (Visura Camerale)
    verificationFile: 'fixtures/dummy_docs/3_visura_camerale_TEST.pdf',
    // Bank account step (ბოლო) — statement (png/jpeg/pdf) + IBAN
    bankAccount: {
      statementFile: 'fixtures/dummy_docs/3_visura_camerale_TEST.pdf', // png/jpeg/pdf
      country: 'Italia',
      accountNumber: 'IT60X0542811101000000123456', // IBAN
      displayName: 'Test Company SRL',
    },
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
