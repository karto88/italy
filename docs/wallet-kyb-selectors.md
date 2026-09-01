# Tppay (Wallet) — Business KYB სრული selector & flow reference

ITALY პორტალი → Business → Tppay (Wallet) ონბორდინგი.
ეს ფაილი = **ერთი წყარო** ყველა selector-ისა და ლოგიკისთვის (რომელ გვერდზე რა ხდება).

Wizard სტეპები (progress bar): **Azienda → Sede → Persone → PEP → AML → Documenti → Firma → Video**

კოდი: `pages/WalletKybPage.ts` · `utils/WalletFlowHelper.ts` · `utils/BusinessFlowHelper.ts` · მონაცემები: `config/portal.config.ts`

---

## 0. რეგისტრაცია (Business) — `BusinessFlowHelper.registerBusiness`

| ქმედება | selector |
|---|---|
| ტელეფონი | `getByRole('spinbutton', { name: 'Phone number' })` → `Log in` |
| SMS OTP | `getByRole('spinbutton', { name: 'Please enter OTP character N' })` — კოდი `111111` (whitelisted) |
| Account type | `AccountTypePage.chooseBusiness()` |
| ფორმა | Name / Surname / Company / Tax code / Email / Password (`Keepz@1234`) + 2 თანხმობა |
| Email verify | `Verify` → Gmail OTP (`noreply@keepz.it`) → OK → `Continue` |

## 1. Yousign ხელშეკრულება — `BusinessFlowHelper.signAgreement`

`Sign` (popup ან იმავე ტაბში) → `Inizia` → scroll → `Continua` → **email OTP** (FIRMA ELETTRONICA) → `Clicca per firmare`.

## 2. Wallet არჩევა + KYB დაწყება — `selectWalletAndStartKyb`

| ქმედება | selector |
|---|---|
| Wallet | `getByRole('button', { name: /^Wallet/i })` |
| Continue | `getByRole('button', { name: /^Continue$/i })` |
| Verify | `getByRole('button', { name: /^Verify$/i })` — ⚠️ **tolerant** (ბიჯი აღარ ვალიდურია — KI-225, თუ არ ჩანს, გამოტოვე) |
| 3 თანხმობა | `label:hasText('Ho preso visione dell'')` / `'Ho preso visione del Foglio'` / `'Accetto Termini e Condizioni'` → checkbox |
| KYB დაწყება | `getByRole('button', { name: 'Inizia il processo KYB' })` |

---

## 3. Azienda (Organization) — `fillOrganization`

| ველი | selector | მნიშვნელობა |
|---|---|---|
| P.IVA | `getByRole('textbox', { name: 'P.IVA' })` | 11 ციფრი (უნიკალური) |
| Forma Giuridica | `combobox 'Forma Giuridica'` → option | `AA` |
| Codice SAE | `textbox 'Codice SAE'` | `430` |
| Codice ATECO | `textbox 'Codice ATECO'` | `702209` |
| REA | `getByRole('textbox', { name: 'REA', exact: true })` | `MI`+ციფრები (უნიკ.) |
| Numero REA | `textbox 'Numero REA'` | უნიკ. |
| Provincia di Iscrizione | `textbox 'Provincia di Iscrizione'` | `74646433` |
| Data Iscrizione | `textbox 'Data Iscrizione'` (pressSequentially) | `08032025` |
| → | `getByRole('button', { name: 'Avanti' })` | |

> Codice Fiscale / Ragione sociale — pre-filled, **არ ვეხებით**.

## 4. Sede (Legal address) — `fillLegalAddress`

| ველი | selector |
|---|---|
| Indirizzo | `#streetOfLegal` |
| Numero | `#houseNumberOfLegal` |
| CAP | `#zipcodeOfLegal` (4-10 ციფრი) |
| Paese | `locator('#row-4').getByRole('combobox', { name: 'Paese' })` → `Italia` |
| Provincia | `combobox 'Provincia'` → **ჯერ ეს** (cascade) |
| Citta | `combobox 'Citta'` → მერე ეს (600ms wait) |
| მისამართი ემთხვევა | `label:hasText('L'indirizzo della sede')` → checkbox |
| PEC | `textbox 'PEC(Email Certificate)'` = **რეგისტრაციის email** |
| Telefono Aziendale | `textbox 'Telefono Aziendale'` (10 ციფრი, 3-ით) |
| → | `Avanti` |

---

## 5. Persone (Rappresentante legale + TE) — `fillPersone` / `addTitolareEffettivo`

**პიროვნებები:** index 0 = **ES / Rappresentante legale** (Nome/Cognome pre-filled).
დამატებითი TE-ები → `getByRole('button', { name: 'Add' })`, index 1, 2, …

### member ველების naming: `3.members.{i}.*`

| ველი | selector (`{i}` = member index) |
|---|---|
| Nome | `input[name="3.members.{i}.name"]` (index 0 pre-filled) |
| Cognome | `input[name="3.members.{i}.surname"]` |
| Data di nascita | ⚠️ დინამ. id → `getByRole('textbox',{name:'Data di nascita'}).nth(i)` — `ddmmyyyy`, წელი <2000 |
| Sesso | ⚠️ დინამ. id → `getByRole('combobox',{name:'Sesso'}).nth(i)` → `M`/`F` |
| Email | `input[name="3.members.{i}.email"]` |
| Telefono | `input[name="3.members.{i}.mobile"]` (10 ციფრი) |
| Paese di nascita | `[id="3.members.{i}.countryName"]` |
| Provincia di nascita | `[id="3.members.{i}.provName"]` |
| Citta di nascita | `[id="3.members.{i}.cityName"]` |
| Codice Fiscale | `getByRole('button',{name:'Generate'}).nth(i)` |
| Indirizzo residenza | `input[name="3.members.{i}.streetOfResidence"]` |
| Numero | `input[name="3.members.{i}.houseNumberOfResidence"]` |
| CAP | `input[name="3.members.{i}.zipcodeOfResidence"]` |
| Paese di residenza | `[id="3.members.{i}.countryOfResidence"]` |
| Provincia di residenza | `[id="3.members.{i}.provinceOfResidence"]` |
| Citta di residenza | `[id="3.members.{i}.cityOfResidence"]` |
| Il domicilio corrisponde… | `input[name="3.members.{i}.domicile"]` (force check → ხურავს domicile მისამართს) |
| Paese fiscale AML | `[id="3.members.{i}.amlFiscalCountry"]` |
| Cittadinanza | `[id="3.members.{i}.citizenship"]` |
| → | `Avanti` |

> member 0-ისთვის residenza-ს dev ID-ები `#houseNumberOfResidence` / `#zipcodeOfResidence`-იც მუშაობს (ერთი პიროვნება).

### ⭐ Ruolo (checkbox) — **კრიტიკული ლოგიკა**

`setMemberRoles(i, {titolare, firmatario})` → checkbox = `label:hasText(text).nth(2*i+1)`.

| ქეისი | ES / Rappresentante (i=0) | TE (i=1) |
|---|---|---|
| **1 პიროვნება** (ES = TE) | ✅ **ორივე** (Titolare effettivo + Firmatario) | — |
| **2 პიროვნება** (ES ≠ TE) | მხოლოდ **Firmatario** (ხელმომწერი) | მხოლოდ **Titolare effettivo** (ბიზნეს ოუნერი) |

> ⚠️ არ შეიძლება ორივე იუზერი Firmatario იყოს. ხელმომწერი = Firmatario, მფლობელი = Titolare effettivo.

### non-EU მოქალაქეობა (residency doc)
Cittadinanza ≠ Italia → `input#residencePermit-row-22[type=file]` (residency doc ატვირთვა).

---

## 6. PEP (Verifica PEP) — `fillPep`

| ქმედება | selector |
|---|---|
| Status PEP (relationship) | `getByText('No', {exact:true})` / `'Persona politica esposta'` (exact) / `'Familiare di una persona'` / `'Legami in affari con una'` |
| Sei una PEP? (ხსნის პოზიციას) | `getByRole('checkbox', { name: /Sei una Persona Politicamente Esposta/i })` |
| Tipo di incarico (პოზიცია) | `locator('label').filter({ hasText: 'Sottosegretario' })` (ან Deputato, Ministro …) |
| Nazione incarico | `combobox 'Nazione incarico'` → `Italia` |
| Status incarico | `combobox 'Status incarico'` → `inprogress` (ან `finished`) |
| **Sono contribuente USA (W9)** | `label:hasText('Sono contribuente USA')` → true-ზე `getByRole('button',{name:'Carica documenti'})` (W9 doc) |
| → | `Avanti` |

> **TC0.14:** ES = US taxpayer → `Sono contribuente USA` მონიშნული + W9 დოკ.
> Happy-path: Status PEP = `No`, USA მოუნიშნავი.

## 7. AML (business) — `fillAml`

| ველი | selector |
|---|---|
| აქტივობები (checkbox) | `getByText('Gestione della tesoreria')` / `'Finanziamenti da soci')` / `'Pagamento dipendenti')` |
| Nazione Geografica di | `combobox 'Nazione Geografica di'` → `Italia` |
| Regione Principale di | `combobox 'Regione Principale di'` → `Abruzzo` |
| Ricavi annui / fatturato | `combobox 'Ricavi annui / fatturato'` → `– 200.000 euro annui` (partial) |
| Patrimonio | `combobox 'Patrimonio'` → `– 500.000 euro` (partial) |
| Numero dipendenti | `combobox 'Numero dipendenti'` → პირველი option |
| → | `Avanti` |

## 8. Documenti — `fillDocumenti`

| ქმედება | selector | მნიშვნელობა |
|---|---|---|
| Visura Camerale | `getByRole('button', { name: 'Carica documenti' })` (filechooser) | company PDF, max 5MB |
| Tipo documento | `combobox 'Tipo documento'` → `Carta d'Identità` / `Patente` / `Passaporto` | |
| ID სურათი | `getByRole('button', { name: 'Carica', exact: true })` (filechooser) | JPG/PNG/JPEG |
| Numero documento | `textbox 'Numero documento'` | |
| Data di rilascio | `textbox 'Data di rilascio'` | `ddmmyyyy` |
| Data scadenza | `textbox 'Data scadenza'` | `ddmmyyyy` |
| Ente rilascio | `combobox 'Ente rilascio'` → Municipality / MCTC / Italian Representation Abroad / Ministry / Police Headquarter | |
| Luogo di rilascio | `textbox 'Luogo di rilascio'` | |
| → | `Avanti` | |

> ⚠️ **multi-person:** "Se hai aggiunto Titolari Effettivi, dovrai caricare anche i loro documenti" — ყოველ TE-ს დოკუმენტიც უნდა აიტვირთოს (TODO: member-ის მიხედვით).

## 9. Firma — `clickFirma` + `signContract` (KYC-ის იგივე ლოგიკა)

| ქმედება | selector |
|---|---|
| Firma დაწყება | `getByRole('button', { name: 'Firma', exact: true })` → კონტრაქტის review |
| scroll ბოლომდე | ყველა scrollable კონტეინერი, სანამ `Firma 1 /` გააქტიურდება |
| Firma 1/N | `getByRole('button', { name: 'Firma 1 /' })` |
| SMS OTP | `getByRole('spinbutton', { name: 'Inserisci il codice SMS *' })` = `12345678` (სტატიკური) |
| ხელმოწერა | `getByRole('button', { name: 'Firma', exact: true })` |
| მე-2 ხელმოწერა | `Continua alla firma` → SMS OTP → `Firma` |

## 10. Video (liveness) — `startVideoVerification` + `assertLiveness`

| ქმედება | selector / შემოწმება |
|---|---|
| Video დაწყება | `getByRole('button', { name: 'Avvia verifica video' })` |
| status assert | `profile/details` → `verificationInfo.tppay.status` = **LIVENESS_PENDING** |

---

## ქეისების ლოგიკა (checklist: `docs/tppay-onboarding.md`)

| TC | პიროვნებები | roles | დოკუმენტი | W9 | სხვა |
|---|---|---|---|---|---|
| **TC0.13** | 1 (ES=TE) | ორივე | CIE | — | happy path ✅ |
| **TC0.14** | 2 (ES≠TE) | ES=Firmatario, TE=Titolare | Patente | ES = USA ✅ | questionnaire combos |
| **TC0.15** | 4 TE, ES ერთ-ერთი | ES=PEP; TE-ები არა | Passaporto + residence permit | — | multi-person |
| **TC0.16** | ES + 4 TE | 1 TE=PEP, 1 W9, 1 business-ties-PEP | — | 1 TE = USA | ყველა დროშა |
| **TC0.17–19** | ES + TE | citizenship (EU/non-EU) | — | — | KO უცხო პასპორტზე / OK იტალიის რეზიდენტობაზე |