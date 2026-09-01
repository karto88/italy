import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * WalletKybPage — Tppay (Wallet) არჩევა + KYB.
 * Wallet → Continue → Verify → 3 თანხმობა → (KYB wizard).
 */
export class WalletKybPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async chooseWallet() {
    await this.page.getByRole('button', { name: /^Wallet/i }).click();
  }
  async clickContinue() {
    await this.page.getByRole('button', { name: /^Continue$/i }).click();
  }
  /** Verify — ხანდახან ცალკე ბიჯია, ხანდახან არა (KI-225). თუ არ ჩანს, გამოტოვე. */
  async clickVerify() {
    const btn = this.page.getByRole('button', { name: /^Verify$/i });
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
    }
  }

  private checkbox(text: string) {
    return this.page.locator('label').filter({ hasText: text }).getByRole('checkbox');
  }

  /** 3 თანხმობის checkbox */
  async acceptTerms() {
    await this.checkbox('Ho preso visione dell’').check();
    await this.checkbox('Ho preso visione del Foglio').check();
    await this.checkbox('Accetto Termini e Condizioni').check();
  }

  /** "Inizia il processo KYB" — KYB wizard-ის დაწყება */
  async startKyb() {
    await this.page.getByRole('button', { name: 'Inizia il processo KYB' }).click();
  }

  // --- KYB Organization (Wallet) ---
  private textbox(name: string) {
    return this.page.getByRole('textbox', { name });
  }
  private async selectFromCombo(comboName: string, optionName: string) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  /**
   * Organization step (Wallet). Codice Fiscale / Ragione sociale — არ ვავსებთ (pre-filled).
   * P.IVA — 11 ციფრი (ვალიდაცია).
   */
  async fillOrganization(data: {
    piva: string;
    formaGiuridica: string;
    codiceSAE: string;
    codiceATECO: string;
    rea: string; // ახალი ფორმატი: "MI-987654" (dash-ით)
    dataIscrizione: string; // ddmmyyyy
  }) {
    // ⚠️ ფორმა შეიცვალა: Numero REA / Provincia di Iscrizione ამოვარდა; REA = "MI-987654"
    await this.textbox('P.IVA').fill(data.piva);
    await this.selectFromCombo('Forma Giuridica', data.formaGiuridica);
    await this.textbox('Codice SAE').fill(data.codiceSAE);
    await this.textbox('Codice ATECO').fill(data.codiceATECO);
    await this.page.getByRole('textbox', { name: 'REA', exact: true }).fill(data.rea);
    // Data Iscrizione — masked date (placeholder DD-MM-YYYY; Organization-ზე ერთადერთი date)
    const d = this.page.locator('input[placeholder="DD-MM-YYYY"]').first();
    await d.click();
    await d.pressSequentially(data.dataIscrizione, { delay: 50 });
  }

  /**
   * Azienda-ს გავლა შემდგარია თუ არა — Sede გვერდის ნიშანი ("Sede Legale e Contatti").
   * REA province-code ვალიდაცია Avanti-ზე ხდება: valid → Sede; invalid → Azienda-ზე რჩება.
   */
  async isPastAzienda(): Promise<boolean> {
    // waitFor — isVisible არ ელოდება; Avanti-ს მერე გვერდის გადასვლას დრო სჭირდება
    try {
      await this.page
        .getByText('Sede Legale e Contatti')
        .first()
        .waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Legal address ქვე-ბიჯი — dev ID-ები + PEC + Telefono.
   * zipcode: 4-10 ციფრი. Telefono: 10 ციფრი, იწყება 3-ით.
   */
  async fillLegalAddress(data: {
    street: string;
    houseNumber: string;
    zipcode: string;
    country: string;
    provincia: string; // ⚠️ აღარ გამოიყენება — Sede-ზე Provincia ველი ამოვარდა
    citta: string;
    pec: string;
    phone: string;
  }) {
    // ⚠️ ფორმა შეიცვალა: ველები role/name-ითაა (Via/Numero/CAP/Paese/Provincia/Citta).
    // default-ზე ორი ბლოკია (legale + operativa). operativa checkbox-ის მონიშვნა
    // ჩახურავს operativa-ს და legal ბლოკში ტოვებს Provincia+Citta comboboxes-ს (cascade).
    // ამიტომ ჯერ checkbox → მერე ერთ (legal) ბლოკს ვავსებთ.
    await this.page
      .locator('label')
      .filter({ hasText: 'L’indirizzo della sede operativa' })
      .getByRole('checkbox')
      .check();

    await this.textbox('Via').first().fill(data.street);
    await this.textbox('Numero').first().fill(data.houseNumber);
    await this.textbox('CAP').first().fill(data.zipcode);

    // Paese (legal — პირველი combobox)
    await this.page.getByRole('combobox', { name: 'Paese' }).first().click();
    await this.page.getByRole('option', { name: data.country, exact: true }).first().click();

    // Provincia → Citta cascade (comboboxes)
    await this.selectFromCombo('Provincia', data.provincia);
    await this.page.waitForTimeout(600); // Citta options cascade
    await this.selectFromCombo('Citta', data.citta);

    await this.textbox('PEC(Email Certificate)').fill(data.pec);
    await this.textbox('Telefono Aziendale').fill(data.phone);
  }

  /**
   * Persone step — Rappresentante legale + Residenza + checkboxes + AML/Cittadinanza.
   * Nome / Cognome — pre-filled (რეგისტრაციიდან), არ ვეხებით.
   * ერთი პიროვნების შემთხვევაში: Titolare effettivo + Firmatario ორივე მონიშნული.
   */
  async fillPersone(data: {
    birthDate: string; // ddmmyyyy
    sesso: string; // 'M' | 'F'
    email: string;
    phone: string; // 10 ციფრი
    paese: string;
    provinciaNascita: string;
    cittaNascita: string;
    indirizzo: string;
    numero: string;
    cap: string;
    paeseResidenza: string;
    provinciaResidenza: string;
    cittaResidenza: string;
    paeseFiscaleAML: string;
    cittadinanza: string;
    cittadinanzaDoc?: string; // Cittadinanza ≠ Italia → residency doc ატვირთვა
    roles?: { titolare?: boolean; firmatario?: boolean }; // default: ორივე (1 პიროვნება)
  }) {
    // --- Rappresentante legale (dev ID-ები: 3.members.0.*; Nome/Cognome pre-filled) ---
    const p = '3.members.0';
    const bd = this.page.locator(`input[id="${p}.dateOfBirth"]`).first();
    await bd.click();
    await bd.pressSequentially(data.birthDate, { delay: 50 });

    await this.selectAutocompleteById(`${p}.gender`, data.sesso);
    await this.page.locator(`input[id="${p}.email"]`).fill(data.email);
    await this.page.locator(`input[id="${p}.mobile"]`).fill(data.phone);

    // Paese / Provincia / Citta di nascita (cascade)
    await this.selectAutocompleteById(`${p}.countryName`, data.paese);
    await this.selectAutocompleteById(`${p}.provName`, data.provinciaNascita);
    await this.page.waitForTimeout(600);
    await this.selectAutocompleteById(`${p}.cityName`, data.cittaNascita);

    await this.page.getByRole('button', { name: 'Generate' }).first().click();

    // --- Residenza ---
    await this.page.locator(`input[id="${p}.streetOfResidence"]`).fill(data.indirizzo);
    await this.page.locator(`input[id="${p}.houseNumberOfResidence"]`).fill(data.numero);
    await this.page.locator(`input[id="${p}.zipcodeOfResidence"]`).fill(data.cap);
    await this.selectAutocompleteById(`${p}.countryOfResidence`, data.paeseResidenza);
    await this.selectAutocompleteById(`${p}.provinceOfResidence`, data.provinciaResidenza);
    await this.page.waitForTimeout(600);
    await this.selectAutocompleteById(`${p}.cityOfResidence`, data.cittaResidenza);

    // "Il domicilio corrisponde alla ..." — domicilio = residenza
    await this.page.locator('label').filter({ hasText: 'Il domicilio corrisponde alla' }).click();

    // --- Ruolo (member 0) — default ორივე (1 პიროვნება); ES≠TE-ზე მხოლოდ Firmatario ---
    await this.setMemberRoles(0, data.roles ?? { titolare: true, firmatario: true });

    // --- AML / Cittadinanza (3.members.0.citizenship — ≠ Italia → residency doc / non-EU ლოგიკა) ---
    await this.selectAutocompleteById(`${p}.amlFiscalCountry`, data.paeseFiscaleAML);
    await this.selectAutocompleteById(`${p}.citizenship`, data.cittadinanza);
    if (data.cittadinanzaDoc) {
      const fc = this.page.waitForEvent('filechooser');
      await this.page.getByRole('button', { name: 'Carica documenti' }).click();
      await (await fc).setFiles(data.cittadinanzaDoc);
    }
  }

  /**
   * PEP step — "Verifica PEP".
   * happy-path: Status PEP = 'No', "Sono contribuente USA" მოუნიშნავი.
   * ვარიაციები (ქეისებისთვის): PEP-yes → Tipo di Incarico + Nazione + Status Incarico;
   * usaTaxpayer=true → Carica documenti (residency/US doc).
   */
  async fillPep(
    members: {
      index: number; // 4.members.{index}
      relationship: string; // 'No' | 'Persona politica esposta' | 'Familiare di una persona politica esposta' | 'Legami in affari con una persona politicamente esposta'
      type?: string; // amlPepType (dropdown) — მხოლოდ PEP-yes
      country?: string; // amlPepCountry — Italia
      startDate?: string; // amlPepStartDate (ddmmyyyy)
      endDate?: string; // amlPepEndDate (ddmmyyyy) — მხოლოდ თუ ongoing=false
      ongoing?: boolean; // "L’incarico è ancora in corso" → true = ისევ თანამდებობაზე (endDate არ საჭიროებს)
      usaTaxpayer?: boolean; // Sono contribuente USA
      usaDoc?: string; // usaTaxpayer=true → W9 doc
    }[]
  ) {
    for (const m of members) {
      const base = `4.members.${m.index}`;
      // Relationship checkbox (id suffix = relationship ტექსტი)
      await this.page.locator(`[id="${base}.amlPepRelationship-${m.relationship}"]`).check({ force: true });

      // No → არაფერი; სხვა → Dettagli PEP
      if (m.relationship !== 'No') {
        await this.selectAutocompleteById(`${base}.amlPepType`, m.type!);
        await this.selectAutocompleteById(`${base}.amlPepCountry`, m.country ?? 'Italia');

        const sd = this.page.locator(`input[id="${base}.amlPepStartDate"]`);
        await sd.click();
        await sd.pressSequentially(m.startDate!, { delay: 50 });

        if (m.ongoing) {
          // ისევ თანამდებობაზე → endDate არ არსებობს
          await this.page
            .locator('label')
            .filter({ hasText: 'L’incarico è ancora in corso' })
            .nth(m.index)
            .getByRole('checkbox')
            .check({ force: true });
        } else {
          const ed = this.page.locator(`input[id="${base}.amlPepEndDate"]`);
          await ed.click();
          await ed.pressSequentially(m.endDate!, { delay: 50 });
        }
      }

      // "Sono contribuente USA" — per-person nth(index)
      if (m.usaTaxpayer) {
        await this.page
          .locator('label')
          .filter({ hasText: 'Sono contribuente USA' })
          .nth(m.index)
          .getByRole('checkbox')
          .check({ force: true });
        if (m.usaDoc) {
          const fc = this.page.waitForEvent('filechooser');
          await this.page.getByRole('button', { name: 'Carica documenti' }).last().click();
          await (await fc).setFiles(m.usaDoc);
        }
      }
    }
  }

  /**
   * AML step (business) — Questionario Antiriciclaggio.
   * activities: checkbox-ები (getByText). combo-ები: Nazione Geografica / Regione /
   * Ricavi annui / Patrimonio / Numero dipendenti.
   */
  async fillAml(data: {
    activities: string[];
    nazioneGeografica: string;
    regionePrincipale: string;
    ricaviAnnui: string;
    patrimonio: string;
    numeroDipendenti?: string; // მითითების გარეშე — პირველი option
  }) {
    for (const a of data.activities) {
      await this.page.getByText(a).click();
    }
    await this.selectFromCombo('Nazione Geografica di', data.nazioneGeografica);
    await this.selectFromCombo('Regione Principale di', data.regionePrincipale);
    // euro option-ები — partial match (– dash / whitespace-ის რისკის გამო)
    await this.selectComboPartial('Ricavi annui / fatturato', data.ricaviAnnui);
    await this.selectComboPartial('Patrimonio', data.patrimonio);
    // Numero dipendenti — თუ მითითებული არაა, პირველი option
    await this.page.getByRole('combobox', { name: 'Numero dipendenti' }).click();
    if (data.numeroDipendenti) {
      await this.page.getByRole('option', { name: data.numeroDipendenti }).first().click();
    } else {
      await this.page.getByRole('option').first().click();
    }
  }

  /** combo → option (partial, case-insensitive; first) */
  private async selectComboPartial(comboName: string, optionName: string) {
    await this.page.getByRole('combobox', { name: comboName }).click();
    await this.page.getByRole('option', { name: optionName, exact: false }).first().click();
  }

  /** ფაილის ატვირთვა ღილაკის (filechooser) გავლით */
  private async uploadViaButton(buttonName: string, file: string, exact = false) {
    const fc = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: buttonName, exact }).click();
    await (await fc).setFiles(file);
  }

  /**
   * Documenti step — Caricamento Documenti.
   * Visura Camerale (company PDF) + პიროვნების დოკუმენტი (Tipo + სურათი + ველები).
   * ⚠️ Titolari Effettivi-ს დამატებისას მათი დოკუმენტებიც უნდა აიტვირთოს (multi-person — მოგვიანებით).
   */
  /**
   * პიროვნების ბარათი Documenti-ზე — სახელით დასკოპებული.
   * anchor = ტექსტი, რომელიც ბარათის მოცვას განსაზღვრავს:
   *  - 'Tipo documento' (Tipo select-ამდე, top)
   *  - 'Luogo di rilascio' (Tipo-ს მერე, wide — ყველა ველს მოიცავს)
   */
  private personCard(name: string, anchor = 'Tipo documento') {
    return this.page
      .locator('div')
      .filter({ hasText: name })
      .filter({ hasText: anchor })
      .last();
  }

  async fillDocumenti(data: {
    companyFile: string;
    persons: {
      cardName: string; // პიროვნების სახელი+გვარი (ბარათის heading)
      tipoDocumento: string;
      personFiles: string[]; // Carta d'Identità → 2 ფაილი (fronte+retro); Patente/Passaporto → 1
      numeroDocumento: string;
      dataRilascio: string; // ddmmyyyy
      dataScadenza: string; // ddmmyyyy
      enteRilascio: string;
      luogoRilascio: string;
    }[];
  }) {
    // 1. Visura Camerale (company PDF, ერთხელ, page-level)
    await this.uploadViaButton('Carica documenti', data.companyFile);

    // 2. თითო პიროვნების დოკუმენტი — ბარათით დასკოპებული
    for (const p of data.persons) {
      // top scope — Tipo documento + Carica (fields-ის რენდერამდე)
      const top = this.personCard(p.cardName, 'Tipo documento');
      await top.getByRole('combobox', { name: 'Tipo documento' }).click();
      await this.page.getByRole('option', { name: p.tipoDocumento, exact: true }).click();
      // Carta d'Identità → "Devi caricare esattamente 2 file" (fronte+retro); სხვა → 1.
      const fc = this.page.waitForEvent('filechooser');
      await top.getByRole('button', { name: 'Carica', exact: true }).click();
      await (await fc).setFiles(p.personFiles);
      await this.page.waitForTimeout(800); // ატვირთვის მერე ველების რენდერი

      // wide scope — ველები რენდერდა → 'Luogo di rilascio'-ით მთელ ბარათს ვსკოპავ
      const card = this.personCard(p.cardName, 'Luogo di rilascio');
      await card.getByRole('textbox', { name: 'Numero documento' }).fill(p.numeroDocumento);
      // თარიღები გადაერქვა: accessible name = placeholder 'DD-MM-YYYY' (2 ცალი: rilascio, scadenza)
      const dates = card.getByRole('textbox', { name: 'DD-MM-YYYY' });
      const dr = dates.nth(0);
      await dr.click();
      await dr.pressSequentially(p.dataRilascio, { delay: 50 });
      const ds = dates.nth(1);
      await ds.click();
      await ds.pressSequentially(p.dataScadenza, { delay: 50 });
      await card.getByRole('combobox', { name: 'Ente rilascio' }).click();
      await this.page.getByRole('option', { name: p.enteRilascio, exact: true }).click();
      await card.getByRole('textbox', { name: 'Luogo di rilascio' }).fill(p.luogoRilascio);
    }
  }

  /**
   * Ruolo checkbox-ები member index-ისთვის.
   * თითო member-ს 2 label-match აქვს თითო role-ზე → checkbox = nth(2*index + 1).
   * (1 პიროვნება → ორივე; ES≠TE → ES=Firmatario, TE=Titolare effettivo)
   */
  private async setMemberRoles(index: number, roles: { titolare?: boolean; firmatario?: boolean }) {
    const check = async (text: string) => {
      await this.page
        .locator('label')
        .filter({ hasText: text })
        .nth(2 * index + 1)
        .locator('input[type="checkbox"]')
        .check({ force: true });
    };
    if (roles.titolare) await check('Titolare effettivo');
    if (roles.firmatario) await check('Firmatario');
  }

  /** MUI Autocomplete id-ით (dev id: "3.members.N.xxx") → option */
  private async selectAutocompleteById(id: string, optionName: string) {
    await this.page.locator(`[id="${id}"]`).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).first().click();
  }

  /**
   * მე-2+ პიროვნების (Titolare Effettivo / Firmatario) დამატება Persone-ზე.
   * "Add" → member index-ის ველების შევსება (3.members.{index}.* naming).
   * Data di nascita / Sesso — დინამიური id → nth(index). Role checkbox-ები → .last().
   */
  async addTitolareEffettivo(
    index: number,
    data: {
      name: string;
      surname: string;
      birthDate: string;
      sesso: string;
      email: string;
      phone: string;
      paese: string;
      provinciaNascita: string;
      cittaNascita: string;
      indirizzo: string;
      numero: string;
      cap: string;
      paeseResidenza: string;
      provinciaResidenza: string;
      cittaResidenza: string;
      paeseFiscaleAML: string;
      cittadinanza: string;
      roles?: { titolare?: boolean; firmatario?: boolean };
    }
  ) {
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.waitForTimeout(800);

    const p = `3.members.${index}`;
    // Nome / Cognome
    await this.page.locator(`input[name="${p}.name"]`).fill(data.name);
    await this.page.locator(`input[name="${p}.surname"]`).fill(data.surname);

    // Data di nascita / Sesso — დინამიური id → nth(index)
    const bd = this.page.getByRole('textbox', { name: 'Data di nascita' }).nth(index);
    await bd.click();
    await bd.pressSequentially(data.birthDate, { delay: 50 });
    await this.page.getByRole('combobox', { name: 'Sesso' }).nth(index).click();
    await this.page.getByRole('option', { name: data.sesso, exact: true }).click();

    // Email / Telefono
    await this.page.locator(`input[name="${p}.email"]`).fill(data.email);
    await this.page.locator(`input[name="${p}.mobile"]`).fill(data.phone);

    // Paese / Provincia / Citta di nascita (cascade)
    await this.selectAutocompleteById(`${p}.countryName`, data.paese);
    await this.selectAutocompleteById(`${p}.provName`, data.provinciaNascita);
    await this.page.waitForTimeout(600);
    await this.selectAutocompleteById(`${p}.cityName`, data.cittaNascita);

    // Codice Fiscale — Generate (index-ური)
    await this.page.getByRole('button', { name: 'Generate' }).nth(index).click();

    // Residenza
    await this.page.locator(`input[name="${p}.streetOfResidence"]`).fill(data.indirizzo);
    await this.page.locator(`input[name="${p}.houseNumberOfResidence"]`).fill(data.numero);
    await this.page.locator(`input[name="${p}.zipcodeOfResidence"]`).fill(data.cap);
    await this.selectAutocompleteById(`${p}.countryOfResidence`, data.paeseResidenza);
    await this.selectAutocompleteById(`${p}.provinceOfResidence`, data.provinciaResidenza);
    await this.page.waitForTimeout(600);
    await this.selectAutocompleteById(`${p}.cityOfResidence`, data.cittaResidenza);

    // domicilio = residenza (stable name → force check; ხურავს domicile მისამართს)
    await this.page.locator(`input[name="${p}.domicile"]`).check({ force: true });

    // Ruolo — default: TE = მხოლოდ Titolare effettivo (ბიზნეს ოუნერი)
    await this.setMemberRoles(index, data.roles ?? { titolare: true, firmatario: false });

    // Paese fiscale AML / Cittadinanza
    await this.selectAutocompleteById(`${p}.amlFiscalCountry`, data.paeseFiscaleAML);
    await this.selectAutocompleteById(`${p}.citizenship`, data.cittadinanza);
  }

  async clickAvanti() {
    await this.page.getByRole('button', { name: 'Avanti' }).click();
  }

  /** Firma step — ხელმოწერის დაწყება ("Firma" ღილაკი → კონტრაქტის review) */
  async clickFirma() {
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
  }

  /** SMS OTP ველი (Inserisci il codice SMS *) */
  private async enterSmsOtp(code: string) {
    const field = this.page.getByRole('spinbutton', { name: 'Inserisci il codice SMS *' });
    await field.click();
    await field.fill('');
    await field.pressSequentially(code, { delay: 40 });
  }

  /**
   * კონტრაქტის ხელმოწერა — KYC individual-ის იგივე ლოგიკა.
   * scroll ბოლომდე (Firma 1/N გააქტიურებამდე) → Firma 1/N → SMS OTP →
   * Firma → Continua alla firma → SMS OTP → Firma (ორმაგი ხელმოწერა).
   */
  async signContract(sms = '12345678') {
    const firma1 = this.page.getByRole('button', { name: 'Firma 1 /' });
    for (let i = 0; i < 30 && !(await firma1.isEnabled().catch(() => false)); i++) {
      // ყველა scrollable კონტეინერი (nested-იც) ბოლომდე
      await this.page.evaluate(() => {
        document.querySelectorAll('*').forEach((el) => {
          if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight;
        });
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(400);
    }
    await firma1.click();
    await this.enterSmsOtp(sms);
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
    await this.page.getByRole('button', { name: 'Continua alla firma' }).click();
    await this.enterSmsOtp(sms);
    await this.page.getByRole('button', { name: 'Firma', exact: true }).click();
  }

  /** Video verification დაწყება (liveness) */
  async startVideoVerification() {
    await this.page.getByRole('button', { name: 'Avvia verifica video' }).click();
  }
}