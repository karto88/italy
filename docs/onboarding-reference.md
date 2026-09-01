# TPPay Onboarding — KYC/KYB Reference (consolidated)

> წყარო: Archive/ (KYC+KYB flow references + test cases). გაერთიანებული ერთ ფაილში.
> ასატვირთი ტესტ-დოკუმენტები: `fixtures/dummy_docs/`


---

# ═══════════ README_START_HERE ═══════════

# TPPay Onboarding Testing — START HERE

This project contains everything needed to execute the TPPay **onboarding** test cases (KYC + KYB) on **staging**, and to let Claude help fill the wizards field-by-field.

## The four reference documents

| File | What it is |
|---|---|
| `KYC_Onboarding_Flow_Reference.md` | **How the KYC wizard works** — every field, conditional, and dropdown (individuals). |
| `KYB_Onboarding_Flow_Reference.md` | **How the KYB wizard works** — every field, conditional, and dropdown (legal entities). |
| `KYC_Test_Cases.md` | **Recipes for TC0.1–TC0.11** (individuals): actor, document, deltas, expected outcome. |
| `KYB_Test_Cases.md` | **Recipes for TC0.12–TC0.19** (legal entities): company, people, roles, flags, files, expected outcome. |

**Suggested order:** read the relevant *Flow Reference* first (to understand the wizard), then follow the matching *Test Cases* file.

## Global facts (apply everywhere)

- **Environment:** staging. Data is dummy but **format validations are real** (Codice Fiscale, dates, IBAN, document numbers must be valid formats).
- **Codice Fiscale:** always produced by the **Generate** button in the form — it is authoritative. Type a consistent identity (name + DOB + birthplace) and press Generate.
- **Liveness (last step, "Video"):** it is a **real** face + document capture done by the person (KYC) or by the signer/ES (KYB). The identity typed in the form must **match** the real document used at liveness. If the tester must use a specific real staging document, replace that person's data and press Generate.
- **Upload formats:** company **Visura Camerale** accepts PDF/JPG/PNG; **per-person ID documents (KYB)** accept **JPG/PNG only**; W-9 and residence-permit slots — format unconfirmed (provided as PDF).
- All dummy files are watermarked **"TEST / FAC-SIMILE"** and are for staging only.

## Dummy files (in the `dummy_docs` folder — upload these to the project)

**Company documents (Visura Camerale):**
`3_visura_camerale_TEST.pdf` (ROSSI & PARTNERS, TC0.13) · `3b_..._VERDI` (TC0.14) · `3c_..._NERI` (TC0.15) · `3d_..._BRUNO` (TC0.16) · `3e_..._ALPI` (TC0.17) · `3f_..._SOLEMARE` (TC0.18) · `3g_..._STELLANORD` (TC0.19)

**W-9 (US taxpayer):** `2_form_W9_TEST.pdf` (Mario Rossi, TC0.14) · `2b_form_W9_Costa_TEST.pdf` (Chiara Costa, TC0.16)

**Residence permit:** `1_permesso_di_soggiorno_TEST.pdf` (Ahmed Hassan — TC0.6 KYC and TC0.15 KYB)

**Person ID images (KYB uploads, PNG):**
`13a_cid_Rossi_ES` · `6_patente_ES_Rossi` + `7_patente_TE_Ferrari` (TC0.14) · `15a–15d passaporto` (TC0.15) · `16a–16e cid` (TC0.16) · `17a/17b passaporto` (TC0.17) · `18a passaporto / 18b cid` (TC0.18) · `19a/19b passaporto` (TC0.19)

**Legacy / superseded (safe to ignore):** `4_carta_identita_TE_TEST.pdf`, `5_patente_TE_Ferrari_TEST.pdf` (early PDF versions replaced by the PNG images above, because per-person KYB uploads must be JPG/PNG).

## Open items to confirm on staging (flagged ⚠️ in the docs)
- **Forma Giuridica** (KYB): the dropdown shows 2-letter codes only — real mapping to S.R.L./S.p.A. unknown.
- **Codice SAE** and **REA / Numero REA** (KYB): exact format and whether mandatory.
- **W-9 / permit** upload slots: PDF vs JPG/PNG.
- **TC0.1 / TC0.12** (document acknowledgment): blocked until the final PDFs are available on staging.


---

# ═══════════ KYC_Onboarding_Flow_Reference ═══════════

# TPPay KYC Onboarding Wizard — Complete Flow Reference

> Purpose: give an AI (or a new tester) everything needed to complete the TPPay **individual (KYC)** onboarding on staging correctly — every field, every conditional, every dropdown value, and how validation behaves.
> Environment: **staging**. Data is dummy, but **format validations are real** (Codice Fiscale, dates, IBAN, document numbers must be valid).
> Liveness is **real**: the wizard's last step ("Video") is a live document + face capture. The document declared in the form must match the real document used at liveness, otherwise KYC fails.

---

## 1. Wizard structure

The KYC wizard has **5 sequential steps** (progress bar at top):

1. **Dati personali** — personal data (largest step, contains conditional blocks)
2. **Documenti** — identity document details
3. **AML** — anti–money-laundering questionnaire (Questionario Antiriciclaggio)
4. **Firma** — contract signature
5. **Video** — real liveness (face + document capture)

Navigation buttons: `Indietro` (back), `Avanti` (next). Final outcome arrives via callback:
- Success: `{ "type": "ONBOARDING_RESULT", "result": "CONFIRMED", "ndg": "<value>", "iban": "<value>" }`
- KYC failure: `event: <esito negativo>`, `reason: <codice errore>`
- Abandoned at signature: `event: <esito KO>` → account not opened → **expired after 30 days**

---

## 2. Step 1 — Dati personali (personal data)

### 2.1 Base fields (always visible)

| Field (IT) | Meaning | Type | Value / rule |
|---|---|---|---|
| Nome | First name | text | free text |
| Cognome | Surname | text | free text |
| Sesso | Sex | dropdown | `F` or `M` |
| Data di nascita | Date of birth | date picker | format `DD-MM-YYYY` (displayed) |
| Nazionalità | Nationality / country of birth | dropdown | country list; default `Italia`. **Drives birthplace fields (see 2.2).** |
| Provincia di nascita | Province of birth | dropdown | Italian provinces — **only shown when Nazionalità = Italia** |
| Comune di nascita | Municipality/city of birth | dropdown OR free text | dropdown when Italy; **free text when foreign** |
| Codice Fiscale | Italian tax code | text + **Generate** button | see 2.4 |
| Paese di residenza | Country of residence | dropdown | usually `Italia` |
| Provincia di residenza | Province of residence | dropdown | Italian provinces |
| Comune di residenza | Municipality of residence | dropdown | |
| Via di residenza | Street | text | free text |
| Numero civico di residenza | Street number | text | free text |
| CAP di residenza | Postal code (ZIP) | text | 5 digits, must match the city |
| ☐ Il domicilio corrisponde alla residenza | "Domicile = residence" | checkbox | see 2.3 |
| Cittadinanza | Citizenship | dropdown | **Drives residence-permit upload (see 2.2).** |
| Paese fiscale AML | Tax country (AML) | dropdown | usually `Italia` |
| Rapporti con PEP | Relationship with a PEP | radio group | see 2.5 |
| ☐ Sei una Persona Politicamente Esposta (PEP)? | "Are you a PEP?" | checkbox | see 2.5 |
| ☐ Sono contribuente USA | "I am a US taxpayer" | checkbox | check → US tax (W-9/FATCA). Leave unchecked unless the case requires it. |

### 2.2 CONDITIONAL — foreign nationality / citizenship

- **If `Nazionalità` ≠ Italia (foreign country):**
  - `Provincia di nascita` **disappears** (foreign countries have no Italian province).
  - `Comune di nascita` becomes a **free-text** field — type the foreign city by hand (e.g. `Il Cairo`).
  - `Generate` still produces a valid Codice Fiscale using the foreign country code (Z-code, e.g. Egypt = `Z336`).
- **If `Cittadinanza` ≠ Italiana:** a helper line appears — *"Se non possiedi la cittadinanza italiana, carica un permesso di soggiorno valido"* — plus a **`Carica documenti`** upload button. Upload a residence permit (PDF).

### 2.3 CONDITIONAL — domicile

- Checkbox **`Il domicilio corrisponde alla residenza`** (domicile = residence).
  - **Checked** → the domicilio block is hidden/auto-filled from residence. (Recommended default.)
  - **Unchecked** → a full domicilio block appears: `Paese di domicilio`, `Comune di domicilio`, `Via di domicilio`, `Numero civico di domicilio`, `CAP di domicilio`.

### 2.4 Codice Fiscale — Generate button

- The **`Generate`** button (label becomes `Regenerate` after first use) computes the tax code from: Nome, Cognome, Sesso, Data di nascita, and birthplace (Nazionalità + Comune di nascita).
- It is **authoritative** — whatever consistent identity you type, Generate returns the matching valid CF. You do not need to pre-compute it.
- Format: 16 chars — 6 letters (surname+name) + 2 digits year + 1 letter month + 2 digits day (day +40 for females) + 4-char place code (Italian cadastral code, or `Z`+3 for foreign countries) + 1 check letter.
- Validation tip: if Generate returns an unexpected code, one of the birth fields (date, province, city, nationality) is wrong.

### 2.5 CONDITIONAL — PEP (Politically Exposed Person)

- **`Rapporti con PEP`** radio options:
  - `No`
  - `Persona politica esposta` (the person is a PEP themselves)
  - `Familiare di una persona politica esposta` (family member of a PEP)
  - `Legami in affari con una persona politicamente esposta` (business ties with a PEP)
- Separate checkbox **`Sei una Persona Politicamente Esposta (PEP)?`**.
- **When PEP is declared** (radio ≠ No and/or checkbox ticked), extra fields appear:
  - **`Tipo di incarico`** (type of office) — long radio list, options include:
    Presidente della Repubblica · Presidente del Consiglio · Ministro · Vice Ministro · Sottosegretario · Presidente di Regione · Assessore Regionale · Sindaco di capoluogo di provincia o città metropolitana · Sindaco di comune con popolazione non inferiore a 15.000 abitanti nonché cariche analoghe in Stati esteri · Deputato · Senatore · Parlamentare Europeo · Consigliere regionale nonché cariche analoghe in Stati esteri · Membro degli organi direttivi centrali di partiti politici · Giudice della Corte Costituzionale · Magistrato della Corte di Cassazione o della Corte dei Conti · Altri componenti del Consiglio di Giustizia Amministrativa per la Regione siciliana · Membro degli organi direttivi delle banche centrali e delle autorità indipendenti · Ambasciatore, incaricato d'affari, ufficiale di grado apicale delle forze armate · Componente degli organi di amministrazione/direzione/controllo di imprese controllate dallo Stato · Direttore generale di ASL e di azienda ospedaliera · Direttore/vicedirettore/membro dell'organo di gestione in organizzazioni internazionali · Consigliere di Stato
  - **`Nazione incarico`** (country of office) — country dropdown (e.g. `Italia`)
  - **`Status incarico`** (office status) — dropdown: `finished` / `inprogress`
- Note: declaring PEP does **not** block onboarding — outcome is still CONFIRMED (enhanced due diligence flag only).

---

## 3. Step 2 — Documenti (identity document)

| Field (IT) | Meaning | Type | Value / rule |
|---|---|---|---|
| Tipo di documento | Document type | dropdown | `Carta d'Identità` · `Patente` · `Passaporto` (only these 3) |
| Numero del documento | Document number | text | format depends on type (see below) |
| Data di rilascio del documento | Issue date | date | past date |
| Data di scadenza del documento | Expiry date | date | future date |
| Luogo di rilascio | Place of issue | text | city |
| Autorità di rilascio | Issuing authority | dropdown | see mapping below |

### 3.1 Important: document types

The form has **only 3 document types**. It does **not** distinguish electronic ID (CIE) from paper ID — both are `Carta d'Identità`. The distinction between an electronic vs paper ID exists only in the **real document** used at the liveness step, not in the form.

| Test document | Select in "Tipo di documento" |
|---|---|
| CIE (electronic ID) | `Carta d'Identità` |
| Paper identity card | `Carta d'Identità` |
| Driving license | `Patente` |
| Passport | `Passaporto` |

### 3.2 Autorità di rilascio — options and mapping

| Option (as shown, EN) | Real authority | Use for |
|---|---|---|
| `Municipality` | Comune | Carta d'Identità |
| `MCTC` | Motorizzazione Civile | Patente |
| `Police Headquarter` | Questura | Passaporto |
| `Ministry` | Ministero (generic) | fallback / foreign passport |
| `Italian Representation Abroad` | Consulate/Embassy | documents issued abroad |

### 3.3 Document number formats (valid dummy patterns)

| Type | Pattern | Example |
|---|---|---|
| Carta d'Identità | 2 letters + 5 digits + 2 letters | `CA12345AB` |
| Patente | province code (2) + 7 digits + 1 letter | `MI5432109X` |
| Passaporto (IT) | 2 letters + 7 digits | `YA1234567` |
| Passaporto (foreign) | country-dependent | `A12345678` |

---

## 4. Step 3 — AML (Questionario Antiriciclaggio)

Three checkbox sections + four dropdowns. **Multiple checkboxes can be selected** in each section.

### 4.1 Scopo del rapporto (purpose of relationship) — checkboxes
- Accredito stipendio/pensione
- Gestione necessità familiari
- Rapporto relativo all'attività imprenditoriale svolta
- Compravendita investimenti alternativi (es: crediti fiscali, crowdfunding)
- Giochi, lotterie & betting
- Operatività in criptovalute
- Trasferimenti su Paesi Extra UE

### 4.2 Origine del reddito (source of income) — checkboxes
- Reddito da lavoro dipendente/pensione
- Reddito da libera professione / lavoro autonomo / attività imprenditoriale svolta
- Rendite immobiliari / fondiarie
- Redditi finanziari
- Pensione/Vitalizio
- Vincite al gioco superiori a € 5.000
- Redditi da investimenti alternativi (es. crowdfunding e simili), cryptovalute superiori a € 50.000,00

### 4.3 Origine del patrimonio (source of wealth) — checkboxes
- Reddito da lavoro dipendente/pensione
- Reddito da lavoro autonomo / attività imprenditoriale svolta
- Eredità/lascito/donazione (somme superiori € 250.000)
- Rendite immobiliari / fondiarie
- Investimenti alternativi (crowdfunding o cryptovalute) per somme superiori € 75.000 oppure 20% del patrimonio
- Investimenti finanziari
- Liquidazione polizze assicurative
- Vincite da gioco (somme superiori € 5.000)
- Cryptovalute

### 4.4 Dropdowns

**Professione svolta (profession):**
Lavoratore dipendente / Dirigente settore privato · Giornalista · Imprenditore · Libero professionista / Lavoratore autonomo · Dipendente PA / Dirigente PA · Avvocato, Notaio, Commercialista, Revisore, Esperto contabile · Studente · Religioso · Pensionato

- **CONDITIONAL:** if `Professione svolta = Lavoratore dipendente / Dirigente settore privato`, a **`Tipologia di contratto`** dropdown appears: `Tempo Determinato` / `Tempo Indeterminato` / `Stage`.
- Other professions likely trigger their own conditional fields (verify on screen).

**Reddito Annuo (annual income):**
`0 - 10.000` · `10.001 - 25.000` · `25.001 - 50.000` · `50.001 - 100.000` · `100.001 - 250.000` · `250.000+`

**Patrimonio (wealth):**
`0 - 10.000` · `10.001 - 25.000` · `25.001 - 50.000` · `50.001 - 100.000` · `100.001 - 250.000` · `250.000+`

**Cariche societarie in Associazioni/Fondazioni (corporate roles in associations/foundations):** `Si` / `No`

---

## 5. Step 4 — Firma (signature)

- The applicant signs the contract.
- **To pass:** sign → proceed to Video.
- **To force a KO (test case):** do **not** sign; leave the flow. Result: `esito KO`, account not opened, expires after 30 days. (You never reach the Video/liveness step.)

---

## 6. Step 5 — Video (real liveness)

- Real face + document capture. The tester performs it with a physical/real document.
- The document must **match** the data declared in the form.
- **To force a KO (test cases):**
  - Declare one identity in the form but present a **different real document** at capture → data mismatch → `esito negativo` + reason code.
  - Upload only the **front** photo in both the front and back slots (for paper ID) → back not validated → `esito negativo` + reason code.

---

## 7. Recommended "standard clean user" values

Use these when a case just needs a plain successful individual (CONFIRMED):

**Dati personali:** Italian citizen, born in Italy, resident in Italy, `Il domicilio corrisponde alla residenza` = checked, `Rapporti con PEP` = `No`, `Sei una PEP?` = unchecked, `Sono contribuente USA` = unchecked, `Codice Fiscale` via **Generate**.

**Documenti:** matching type + authority (Carta d'Identità→Municipality, Patente→MCTC, Passaporto→Police Headquarter), issue date in the past, expiry in the future.

**AML block:**
- Scopo del rapporto → `Accredito stipendio/pensione`
- Origine del reddito → `Reddito da lavoro dipendente/pensione`
- Origine del patrimonio → `Reddito da lavoro dipendente/pensione`
- Professione svolta → `Lavoratore dipendente / Dirigente settore privato` → Tipologia di contratto → `Tempo Indeterminato`
- Reddito Annuo → `25.001 - 50.000`
- Patrimonio → `50.001 - 100.000`
- Cariche societarie → `No`

**Firma:** sign. **Video:** real liveness with the matching document. → **CONFIRMED**.

---

## 8. Quick conditional-logic map

| Trigger | Effect |
|---|---|
| `Nazionalità` = foreign | `Provincia di nascita` hidden; `Comune di nascita` becomes free text; CF uses Z-country code |
| `Cittadinanza` ≠ Italiana | Residence-permit upload button appears (`Carica documenti`) |
| `Il domicilio corrisponde alla residenza` unchecked | Full domicilio address block appears |
| `Rapporti con PEP` ≠ No / `Sei una PEP?` checked | `Tipo di incarico` + `Nazione incarico` + `Status incarico` appear |
| `Sono contribuente USA` checked | US tax handling (expect W-9 / FATCA data) |
| `Professione svolta` = Lavoratore dipendente | `Tipologia di contratto` dropdown appears |

---

## 9. Codice Fiscale / country codes (reference)

- Italian place codes are the **Belfiore/cadastral** codes (e.g. Roma = `H501`, Milano = `F205`, Napoli = `F839`, Torino = `L219`).
- Foreign countries use `Z` + 3 digits (e.g. Egypt = `Z336`).
- Females: birth day + 40 in the CF.
- The **Generate** button handles all of this — this section is only for validation/debugging.

---

*Last updated: 2026-07-07. Based on TPPay staging KYC wizard (Onboarding checklist v18). KYB (legal entities) is a separate wizard — documented separately.*


---

# ═══════════ KYC_Test_Cases ═══════════

# TPPay KYC Test Cases (Individuals) — TC0.1 → TC0.11

> Companion to **`KYC_Onboarding_Flow_Reference.md`** (that file explains every field, conditional, and dropdown of the KYC wizard — read it first).
> Environment: **staging**. Data is dummy but **format validations are real** (Codice Fiscale, dates, document numbers must be valid).
> The wizard has 5 steps: **Dati personali → Documenti → AML → Firma → Video (real liveness).**

---

## How to read this file

Each test case gives: the **goal**, the **actor** (which dummy identity to type into the form), the **document type**, only the **fields that differ from the standard fill**, the **action that forces the expected outcome**, and the **expected callback**.

Fields not mentioned in a case use the **STANDARD KYC FILL** below.

### ⚠️ Liveness & identity matching (important)
The final step (**Video**) is a **real** liveness (face + document capture) performed by the tester. The identity **typed into the form must match the real document used at liveness**. The dummy identities below are consistent, valid examples — if the tester must use a specific real staging document at liveness, replace the actor's personal data (Nome, Cognome, sesso, DOB, birthplace) with that document's data and press **Generate** to recompute the Codice Fiscale. For the "negative" cases (TC0.7, TC0.8) the mismatch is intentional.

### Codice Fiscale
Always produced by the **Generate** button in the form (authoritative). The CF shown per actor is the expected result — if Generate returns something else, a birth field was entered wrong.

---

## STANDARD KYC FILL (baseline for a clean Italian individual)

**Dati personali**
- Nazionalità `Italia`; Provincia + Comune di nascita = the actor's Italian birthplace
- Codice Fiscale → **Generate**
- Paese di residenza `Italia`; Provincia + Comune di residenza = actor's city; Via/Numero/CAP = valid address
- ☑ **Il domicilio corrisponde alla residenza** (checked)
- Cittadinanza `Italiana`
- Paese fiscale AML `Italia`
- Rapporti con PEP → `No`; ☐ Sei una PEP? unchecked; ☐ Sono contribuente USA unchecked

**Documenti** — document type + matching authority, issue date in the past, expiry in the future:
- Carta d'Identità → Autorità `Municipality`
- Patente → Autorità `MCTC`
- Passaporto → Autorità `Police Headquarter`

**AML (standard)**
- Scopo del rapporto → ☑ `Accredito stipendio/pensione`
- Origine del reddito → ☑ `Reddito da lavoro dipendente/pensione`
- Origine del patrimonio → ☑ `Reddito da lavoro dipendente/pensione`
- Professione svolta → `Lavoratore dipendente / Dirigente settore privato` → **Tipologia di contratto** → `Tempo Indeterminato`
- Reddito Annuo → `25.001 - 50.000`
- Patrimonio → `50.001 - 100.000`
- Cariche societarie in Associazioni/Fondazioni → `No`

**Firma** → sign. **Video** → real liveness with the matching document.

---

## Dummy actors (KYC)

| Actor | Sex | DOB | Birthplace | Codice Fiscale |
|---|---|---|---|---|
| Mario Rossi | M | 15/03/1985 | Roma (RM) | `RSSMRA85C15H501R` |
| Giulia Bianchi | F | 22/07/1990 | Milano (MI) | `BNCGLI90L62F205R` |
| Luca Ferrari | M | 03/11/1978 | Milano (MI) | `FRRLCU78S03F205L` |
| Anna Esposito | F | 28/01/1982 | Napoli (NA) | `SPSNNA82A68F839L` |
| Ahmed Hassan | M | 12/05/1988 | Il Cairo, Egitto (non-EU) | `HSSHMD88E12Z336L` |
| Paolo Romano | M | 09/06/1975 | Torino (TO) | `RMNPLA75H09L219B` |
| Elena Conti | F | 17/09/1988 | Roma (RM) | `CNTLNE88P57H501J` |
| Giovanni Greco | M | 20/04/1980 | Roma (RM) | `GRCGNN80D20H501V` |
| Matteo Gallo | M | 14/02/1979 | Torino (TO) | `GLLMTT79B14L219T` |

## Dummy upload files used in KYC
- `1_permesso_di_soggiorno_TEST.pdf` — residence permit (Ahmed Hassan) → **TC0.6 only**.
- All other KYC cases use the tester's real document at liveness; no ID file upload in the form.

---

## TC0.1 — Document acknowledgment (pre-onboarding)
- **Goal:** at onboarding start the user sees the 4 PDFs (pre-contractual disclosure/Information Sheets, privacy notice, FEA, summary costs), can open them, ticks the acknowledgment checkbox(es), confirms.
- **Action:** capture a screenshot/video showing the 4 PDFs are visible and acknowledgeable.
- **Expected:** the 4 documents are viewable + acknowledgment recorded (ideally with timestamp).
- **⚠️ Blocker:** requires the final PDFs to be present on staging. Confirm availability before executing.

## TC0.2 — CIE (electronic ID)
- **Actor:** Mario Rossi · **Document type:** `Carta d'Identità` (the form has no separate CIE option; CIE = Carta d'Identità).
- Documenti: Numero `CA12345AB`, rilascio `10/01/2022`, scadenza `09/01/2032`, Luogo `Roma`, Autorità `Municipality`.
- Standard fill otherwise. Sign → real liveness with the CIE.
- **Expected:** `CONFIRMED` (ndg + iban).

## TC0.3 — Paper identity card
- **Actor:** Giulia Bianchi · **Document type:** `Carta d'Identità` (paper = same option).
- Documenti: Numero `AR1234567`, rilascio `05/06/2019`, scadenza `04/06/2029`, Luogo `Milano`, Autorità `Municipality`.
- **Expected:** `CONFIRMED`.

## TC0.4 — Driving license
- **Actor:** Luca Ferrari · **Document type:** `Patente`.
- Documenti: Numero `MI5432109X`, rilascio `12/09/2018`, scadenza `11/09/2028`, Luogo `Milano`, Autorità `MCTC`.
- **Expected:** `CONFIRMED`.

## TC0.5 — Passport
- **Actor:** Anna Esposito · **Document type:** `Passaporto`.
- Documenti: Numero `YA1234567`, rilascio `15/04/2020`, scadenza `14/04/2030`, Luogo `Napoli`, Autorità `Police Headquarter`.
- **Expected:** `CONFIRMED`.

## TC0.6 — Non-EU citizen + residence permit
- **Actor:** Ahmed Hassan (born non-EU, Egyptian citizen).
- **Dati personali differences:**
  - Nazionalità `Egitto` → `Provincia di nascita` disappears; `Comune di nascita` becomes free text → type `Il Cairo`.
  - Codice Fiscale → **Generate** → `HSSHMD88E12Z336L`.
  - Residence in Italy (e.g., Roma, Via Nazionale 25, 00184).
  - **Cittadinanza `Egiziana`** → residence-permit upload appears → **Carica documenti** → `1_permesso_di_soggiorno_TEST.pdf`.
- **Documento:** `Passaporto` (foreign) — Numero `A12345678`, rilascio `01/03/2021`, scadenza `28/02/2028`, Luogo `Il Cairo`, Autorità `Ministry`.
- **Expected:** `CONFIRMED`.
- Reminder: the permit upload is driven by **Cittadinanza** (not by Paese di nascita).

## TC0.7 — Declared data ≠ document (negative)
- **Actor (form):** Paolo Romano · **Document type:** `Carta d'Identità` (Numero `CA55667AB`, rilascio `03/02/2021`, scadenza `02/02/2031`, Luogo `Torino`, Autorità `Municipality`).
- Fill everything so the **form-level** validation passes.
- **Force the outcome:** at the **Video/liveness** step use a **different real document** than "Paolo Romano" (different name/identity). Declared ≠ scanned → mismatch.
- **Expected:** `esito negativo` + `reason (codice errore)`. Record the reason code.

## TC0.8 — Only front photo uploaded for both sides (negative)
- **Actor:** Elena Conti · **Document type:** `Carta d'Identità` (Numero `CA77889AB`, rilascio `10/05/2022`, scadenza `09/05/2032`, Luogo `Roma`, Autorità `Municipality`).
- **Force the outcome:** at the document capture step, upload the **front** photo into **both** the front and the back slots.
- **Expected:** `esito negativo` + reason. **Keep this user** — TC0.9 fixes it.

## TC0.9 — Fix TC0.8 via data upload/update API (positive)
- **Not a pure UI flow** — continuation of TC0.8's failed case; needs backend (Vivian).
- **Steps:**
  1. Take the NDG / case ID from the TC0.8 result.
  2. Ask backend (Vivian) to invoke the **data upload/update API** for that user, uploading the **correct front + back** ID images (two distinct valid sides).
  3. Re-run liveness for the same case with the correct paper ID.
- **Expected:** `esito positivo`.

## TC0.10 — Driving license + PEP declared
- **Actor:** Giovanni Greco · **Document type:** `Patente` (Numero `RM7788990Z`, rilascio `05/07/2019`, scadenza `04/07/2029`, Luogo `Roma`, Autorità `MCTC`).
- **Dati personali PEP block:** Rapporti con PEP → `Persona politica esposta`; ☑ **Sei una PEP?**. Then the PEP detail fields appear:
  - Tipo di incarico → `Deputato`; Nazione incarico → `Italia`; Status incarico → `inprogress`.
- **Expected:** `CONFIRMED` (PEP is allowed; flagged for enhanced due diligence).

## TC0.11 — No contract signature (KO)
- **Actor:** Matteo Gallo · **Document type:** `Patente` (Numero `TO4455667Y`, rilascio `20/03/2020`, scadenza `19/03/2030`, Luogo `Torino`, Autorità `MCTC`).
- Fill everything through AML normally.
- **Force the outcome:** reach **Firma** and **do NOT sign** — leave/exit. (You never reach Video.)
- **Expected:** `esito KO` — account not opened; case moves to **expired** after 30 days.

---

## Quick outcome map

| TC | Document | Special | Expected |
|---|---|---|---|
| TC0.1 | — | view 4 PDFs + acknowledge | evidence (blocked on final PDFs) |
| TC0.2 | Carta d'Identità (CIE) | standard | CONFIRMED |
| TC0.3 | Carta d'Identità (paper) | standard | CONFIRMED |
| TC0.4 | Patente | standard | CONFIRMED |
| TC0.5 | Passaporto | standard | CONFIRMED |
| TC0.6 | Passaporto (foreign) | non-EU citizen + permit upload | CONFIRMED |
| TC0.7 | Carta d'Identità | declared ≠ liveness document | esito negativo + reason |
| TC0.8 | Carta d'Identità | front photo for both sides | esito negativo + reason |
| TC0.9 | (fix of TC0.8) | data upload/update API + re-liveness | esito positivo |
| TC0.10 | Patente | PEP declared | CONFIRMED |
| TC0.11 | Patente | contract NOT signed | esito KO → expired 30d |


---

# ═══════════ KYB_Onboarding_Flow_Reference ═══════════

# TPPay KYB Onboarding Wizard — Complete Flow Reference

> Purpose: give an AI (or a new tester) everything needed to complete the TPPay **legal-entity (KYB)** onboarding on staging correctly — every field, every conditional, every dropdown value, and how validation behaves.
> Environment: **staging**. Data is dummy, but **format validations are real** (company Codice Fiscale / P.IVA, IBAN, dates, document numbers must be valid).
> Liveness is **real**: the wizard's last step ("Video") is a live capture performed by the signer (Firmatario / ES).
> Companion file: `KYC_Onboarding_Flow_Reference.md` (individuals).

---

## 0. Key terminology

| Term | Italian | Meaning |
|---|---|---|
| **ES** | Esecutore / Firmatario | The signer — the person who signs the contract for the company |
| **TE** | Titolare Effettivo | Beneficial owner (UBO) |
| Rappresentante Legale | — | Legal representative (often the same person as the signer) |

A single person can hold **both** roles (TE + Firmatario) — you select both role checkboxes. There can be multiple TEs and one or more signers.

---

## 1. Wizard structure

The KYB wizard has **8 sequential steps** (progress bar at top):

1. **Azienda** — company identifying data
2. **Sede** — legal seat + operating seat + contacts
3. **Persone** — legal representative, beneficial owners, signers (add multiple people here)
4. **PEP** — PEP verification, **one card per person** added in step 3
5. **AML** — company anti–money-laundering questionnaire
6. **Documenti** — company documents (Visura Camerale) + per-person documents + Procura
7. **Firma** — contract signature
8. **Video** — real liveness (performed by the signer)

Navigation: `Indietro` (back), `Avanti` (next). Outcome callbacks are the same as KYC:
- Success: `{ "type": "ONBOARDING_RESULT", "result": "CONFIRMED", "ndg": "<value>", "iban": "<value>" }`
- Failure / KO: negative esito + reason code (mismatch, missing docs, unsigned contract, etc.)

---

## 2. Step 1 — Azienda (company info) — "Informazioni Azienda"

Two-column layout. All fields describe the company.

| Field (IT) | Meaning | Type | Value / rule |
|---|---|---|---|
| Codice Fiscale | Company tax code | text | 11 digits for companies (usually **= P.IVA**) |
| P.IVA | VAT number | text | 11 digits, valid checksum |
| Ragione sociale | Legal/company name | text | free text |
| Forma Giuridica | Legal form | dropdown | Shows **2-letter codes only, no descriptive labels** (`AA`, `AC`, `AE`, `AF`, `AI`, `AL`, …). No visible legend → exact S.R.L./S.p.A. mapping unknown. On staging any valid code passes format validation; pick one (e.g. `AA`) unless a case checks the specific form. Required field. |
| Codice SAE | Sector of Economic Activity code | text | e.g. `430` for non-financial private company. **TO CONFIRM exact code** |
| Codice ATECO | ATECO activity code | text | e.g. `620100` (software) |
| REA | REA registry (province part) | text | province sigla, e.g. `RM`. **TO CONFIRM (REA vs Numero REA split)** |
| Numero REA | REA number | text | digits, e.g. `1234567` |
| Provincia di Iscrizione | Province of registration | text/dropdown | e.g. `Roma (RM)` |
| Data Iscrizione | Registration date | date | past date |

---

## 3. Step 2 — Sede (legal seat & contacts) — "Sede Legale e Contatti"

### 3.1 Legal seat (sede legale)
| Field (IT) | Meaning | Value / rule |
|---|---|---|
| Via | Street | free text |
| Numero | Street number | free text |
| CAP | Postal code | 5 digits, match the city |
| Paese | Country | dropdown (e.g. `Italia`) |
| Citta | City | free text |

### 3.2 CONDITIONAL — operating seat
- Checkbox **`L'indirizzo della sede operativa corrisponde alla sede legale`** (operating address = legal address).
  - **Checked** → the second (operating seat) block is hidden/auto-filled. (Recommended default.)
  - **Unchecked** → a second block appears: `Via`, `Numero`, `CAP`, `Paese`, `Citta` for the operating seat.

### 3.3 Contacts
| Field (IT) | Meaning | Value / rule |
|---|---|---|
| PEC (Email Certificate) | Certified email | valid email format, e.g. `name@pec.it` |
| Prefisso cellulare | Phone country prefix | dropdown, default `39` |
| Telefono Aziendale | Company phone | digits |

---

## 4. Step 3 — Persone (people: legal rep, UBOs, signers)

Header: "Rappresentante Legale — Dati del rappresentante legale e titolari effettivi". You add **one card per person**; the first is the legal representative.

### 4.1 Person identity fields
| Field (IT) | Meaning | Type | Value / rule |
|---|---|---|---|
| Nome / Cognome | First / last name | text | free text |
| Data di nascita | DOB | date | |
| Sesso | Sex | dropdown | `F` / `M` |
| Email | Email | text | valid email |
| Prefisso cellulare / Telefono | Phone prefix + number | dropdown + text | `39` + digits |
| Paese | Country (of birth) | dropdown | drives foreign-birth behavior (see 4.4) |
| Citta di nascita | City of birth | text | free text |
| Codice Fiscale | Tax code | text + **Generate** | Generate is authoritative (same logic as KYC — computes from name/DOB/sex/birthplace; foreign birth → Z-code) |

### 4.2 Residence block ("Residenza")
| Field (IT) | Meaning |
|---|---|
| Indirizzo di residenza / Numero / CAP | Street / number / ZIP |
| Paese di residenza | Country (dropdown, default `Italia`) |
| Provincia di residenza | Province (dropdown) |
| Citta di residenza | City (dropdown) |

### 4.3 CONDITIONAL — domicile
- Checkbox **`Il domicilio corrisponde alla residenza`**.
  - Checked → domicile block hidden/auto-filled (recommended).
  - Unchecked → block appears: `Indirizzo di domicilio`, `Numero`, `CAP`, `Paese di domicilio`, `Citta di domicilio`.

### 4.4 Ruolo (role) — REQUIRED
- Instruction: *"Seleziona tutte le opzioni applicabili. Ad esempio, se sei sia titolare effettivo sia il firmatario, seleziona entrambe."*
- Checkboxes:
  - ☐ **`Titolare effettivo`** = beneficial owner (TE)
  - ☐ **`Firmatario`** = signer (ES)
- Select one or both. If the same person is both TE and signer → check both.

### 4.5 Tax & citizenship
| Field (IT) | Meaning | Value / rule |
|---|---|---|
| Paese fiscale AML | Tax country (AML) | dropdown, usually `Italia` |
| Cittadinanza | Citizenship | dropdown |

### 4.6 CONDITIONAL — residence permit
- The permit upload is driven **only by `Cittadinanza` (citizenship)**, NOT by `Paese` (country of birth).
  - `Cittadinanza` ≠ Italiana → helper line *"Se non possiedi la cittadinanza italiana, carica un permesso di soggiorno valido"* + **`Carica documenti`** button → upload residence permit.
  - `Paese` (di nascita) = foreign only affects the Codice Fiscale (Z-code) and makes `Citta di nascita` free-text; it does **not** require a permit.
- This is correct/expected: a person born abroad but holding Italian citizenship needs no permit; a non-Italian citizen (even if born in Italy) does. To trigger the permit for a foreign national, set both `Paese` (nascita) = foreign country **and** `Cittadinanza` = foreign.

### 4.7 Add more people
- Text: *"Puoi aggiungere ulteriori titolari effettivi o firmatari."*
- **`+ Add`** button → adds another person card (repeat 4.1–4.6). Use this to reach 2, 4, etc. TEs required by a test case.

---

## 5. Step 4 — PEP (Verifica PEP)

Header: "Verifica PEP (Politically Exposed Person) — Indica eventuali relazioni con Persone Politicamente Esposte."

**One card per person** added in step 3 (identified by name, e.g. "mimino Guga"). Each card:

| Field (IT) | Type | Value / rule |
|---|---|---|
| ☐ PEP | checkbox | tick if this person is/related to a PEP |
| Status PEP | radio | `No` / `Persona politica esposta` / `Familiare di una persona politica esposta` / `Legami in affari con una persona politicamente esposta` |
| Sono contribuente USA | checkbox | US taxpayer (see conditional) |

### 5.1 CONDITIONAL — PEP details
- When `PEP` is checked (and Status ≠ No), a **"Dettagli PEP"** block appears:
  - **`Tipo di Incarico`** — long radio list (identical to KYC): Presidente della Repubblica · Presidente del Consiglio · Ministro · Vice Ministro · Sottosegretario · Presidente di Regione · Assessore Regionale · Sindaco di capoluogo di provincia o città metropolitana · Sindaco di comune ≥15.000 abitanti · Deputato · Senatore · Parlamentare Europeo · Consigliere regionale · Membro degli organi direttivi centrali di partiti politici · Giudice della Corte Costituzionale · Magistrato della Corte di Cassazione o della Corte dei Conti · Altri componenti del Consiglio di Giustizia Amministrativa per la Regione siciliana · Membro degli organi direttivi delle banche centrali e delle autorità indipendenti · Ambasciatore/incaricato d'affari/ufficiale apicale forze armate · Componente organi di amministrazione di imprese controllate dallo Stato · Direttore generale di ASL / azienda ospedaliera · Direttore/vicedirettore/membro organo di gestione in organizzazioni internazionali · Consigliere di Stato
  - **`Nazione Incarico`** — country dropdown (e.g. `Italia`)
  - **`Status Incarico`** — dropdown: `finished` / `inprogress`

### 5.2 CONDITIONAL — US taxpayer (W-9)
- When `Sono contribuente USA` is checked → helper line *"Carica il modulo IRS W-9"* + **`Carica documenti`** → upload W-9 (PDF).

---

## 6. Step 5 — AML (Questionario Antiriciclaggio) — COMPANY version

Different from the individual KYC questionnaire. Three checkbox sections (multi-select) + four dropdowns.

### 6.1 Scopo del rapporto (purpose) — checkboxes
- Gestione della tesoreria
- Gestione ordinaria dell'attività
- Incasso fatture
- Compravendita investimenti alternativi
- Raccolta denaro per finanziare progetto

### 6.2 Origine dei fondi (source of funds) — checkboxes
- Conferimenti da soci
- Finanziamenti da soci
- Finanziamenti da Istituti Finanziari
- Patrimonio sociale
- Ricavi da attività

### 6.3 Destinazione fondi (use of funds) — checkboxes
- Acquisti da fornitori
- Pagamento dipendenti
- Prelievi in contanti
- Giochi, lotterie e betting
- Investimenti finanziari
- Trasferimenti su Paesi UE
- Trasferimenti su Paesi Extra UE
- Investimenti

### 6.4 Dropdowns (all confirmed)
| Field (IT) | Meaning | Values |
|---|---|---|
| Nazione Geografica di svolgimento attività | Country where activity is carried out | country dropdown (e.g. `Italia`) |
| Regione Principale di svolgimento attività economica | Main region of activity | **appears after selecting Italy** — the 20 Italian regions: Abruzzo, Basilicata, Calabria, Campania, Emilia-Romagna, Friuli Venezia Giulia, Lazio, Liguria, Lombardia, Marche, Molise, Piemonte, Puglia, Sardegna, Sicilia, Toscana, Trentino-Alto Adige, Umbria, Valle d'Aosta, Veneto |
| Ricavi annui / fatturato | Annual revenue / turnover | `0 – 200.000` · `200.001 – 500.000` · `500.001 – 800.000` · `800.001 – 1.000.000` · `1.000.000 – 1.500.000` · `1.500.000+` euro annui |
| Patrimonio | Wealth/assets | `0 – 200.000` · `200.001 – 500.000` · `500.001 – 800.000` · `800.001 – 1.000.000` · `1.000.000 – 1.500.000` · `1.500.000+` euro |
| Numero dipendenti | Number of employees | `1-10` · `11-50` · `51-100` · `101-250` · `250+` |

---

## 7. Step 6 — Documenti (Caricamento Documenti)

Header: "Carica i documenti richiesti per la verifica."

**IMPORTANT — upload formats differ by slot:**
- **Visura Camerale** (company): accepts **PDF, JPG, PNG — max 5MB**.
- **Per-person identity document** (each person card): accepts **JPG or PNG only** (label "JPG o PNG" under the upload) — **not PDF**.

### 7.1 Documenti Societari (company documents)
- **Visura Camerale** → `Carica documenti` (company register extract; PDF/JPG/PNG).

### 7.2 Per-person document (one card per person)
| Field (IT) | Meaning | Value / rule |
|---|---|---|
| Tipo documento | Document type | dropdown — **TO CONFIRM (likely Carta d'Identità / Patente / Passaporto as in KYC)** |
| Procura | Power of attorney | upload button — required only when the signer is **not** the legal representative; skip when ES is the legal rep |
| (ID document image) | ID scan | **JPG or PNG only** — upload the person's identity document image |
| Numero documento | Document number | format per type |
| Data di rilascio | Issue date | past |
| Data scadenza | Expiry date | future |
| Ente rilascio | Issuing authority | dropdown — **TO CONFIRM (likely Municipality / MCTC / Police Headquarter / Ministry / Italian Representation Abroad as in KYC)** |
| Luogo di rilascio | Place of issue | city |

- Info note: *"Se hai aggiunto Titolari Effettivi, dovrai caricare anche i loro documenti"* → you must upload an ID document (JPG/PNG) for **every** person card, including each TE. Observed: an upload is required on **every** person card (both ES and TE).

---

## 8. Step 7 — Firma (signature)

- The signer (ES) signs the contract.
- To pass: sign → Video. To force a KO test case: do not sign (account not opened, expires after 30 days).

---

## 9. Step 8 — Video (real liveness)

- Real face + document capture, performed by the **signer (ES / Firmatario)**.
- The document must match the declared data. Mismatch → negative esito + reason.

---

## 10. Recommended "standard clean company" values

Aligned with the dummy Visura PDF (`ROSSI & PARTNERS S.R.L.`):

- **Azienda:** Codice Fiscale/P.IVA `09876543019`, Ragione sociale `ROSSI & PARTNERS S.R.L.`, Forma Giuridica = S.R.L. code (confirm), ATECO `620100`, Numero REA `1234567`, Provincia `Roma (RM)`, Data Iscrizione `15/03/2015`.
- **Sede:** `Via Roma 10`, `00100`, `Italia`, `Roma`; operating = legal (checked); PEC `rossipartners@pec.it`, prefix `39`, phone `0612345678`.
- **Persone:** at least one person; set Ruolo appropriately; use **Generate** for CF.
- **PEP:** No unless the case requires it.
- **AML:** ≥1 (or ≥2 where a case requires "combinations") in each of the 3 sections; pick sensible brackets.
- **Documenti:** upload Visura Camerale; per-person doc type + fields; upload each TE's ID.
- **Firma:** sign. **Video:** liveness by the signer. → CONFIRMED.

---

## 11. Quick conditional-logic map

| Trigger | Effect |
|---|---|
| `L'indirizzo della sede operativa corrisponde alla sede legale` unchecked | Operating-seat address block appears |
| Person `Paese` (birth) = foreign | Foreign-birth handling in CF (Z-code); city typed free-text |
| Person `Il domicilio corrisponde alla residenza` unchecked | Domicile address block appears |
| Person `Cittadinanza` ≠ Italiana | Residence-permit upload appears on that person's card |
| `+ Add` (step 3) | Adds another person card → also adds a PEP card (step 4) and a document card (step 6) for that person |
| PEP checkbox ticked (step 4) | `Tipo di Incarico` + `Nazione Incarico` + `Status Incarico` appear on that person's card |
| `Sono contribuente USA` ticked (step 4) | W-9 upload appears on that person's card |
| TE added (step 3) | That TE's ID document upload becomes required (step 6) |
| Signer ≠ legal representative | `Procura` (power of attorney) upload required for the signer |

---

## 12. Open items — TO CONFIRM (update this file when observed)

- **Forma Giuridica**: full list of 2-letter codes and which = S.R.L. / S.p.A. / etc.
- **Codice SAE**: correct code for a standard private company.
- **REA vs Numero REA**: exact split (province letters vs number) and whether `Provincia di Iscrizione` duplicates it.
- **Step 6 dropdowns**: `Tipo documento` and `Ente rilascio` option lists (assumed same as KYC — verify).
- **Procura**: exact rule for when it is mandatory.

*Resolved: AML has a `Regione Principale` field (20 Italian regions) after nation; Ricavi/Patrimonio/Numero dipendenti brackets confirmed; per-person ID upload is JPG/PNG only.*

---

*Last updated: 2026-07-07. Based on TPPay staging KYB wizard (Onboarding checklist v18). Update this file whenever new KYB flow behavior is observed.*


---

# ═══════════ KYB_Test_Cases ═══════════

# TPPay KYB Test Cases (Legal Entities) — TC0.12 → TC0.19

> Companion to **`KYB_Onboarding_Flow_Reference.md`** (that file explains every field, conditional, and dropdown of the KYB wizard — read it first).
> Environment: **staging**. Data is dummy but **format validations are real**.
> The wizard has 8 steps: **Azienda → Sede → Persone → PEP → AML → Documenti → Firma → Video (real liveness).**
> Terminology: **ES = Esecutore/Firmatario** (signer) · **TE = Titolare Effettivo** (beneficial owner).

---

## How to read this file

Each case gives: the **company** to use, the **people** (with role, identity, flags, document), the **AML** choices, the **files** to upload, and the **expected** outcome. Fields not listed use the **STANDARD KYB FILL** below.

### ⚠️ Liveness & identity matching (important)
The final step (**Video**) is a **real** liveness performed by the **signer (ES)**. The ES identity typed into the form must **match the real document** used at liveness — if the tester must use a specific real staging document, replace the ES personal data and press **Generate** for the CF. The **TE** identities are verified via the **uploaded ID images** (the provided PNGs), so those can stay as given.

### ⚠️ Upload formats (per the wizard)
- **Visura Camerale** (company doc): PDF / JPG / PNG.
- **Per-person identity document** (each person card): **JPG or PNG only** — the provided ID files are PNG for this reason.
- **W-9** and **residence permit** uploads: format not yet confirmed; the provided files are PDF. If a slot rejects PDF, request a PNG version.

### Codice Fiscale
Always via the **Generate** button (authoritative). CFs shown are the expected result. Foreign birth country → CF ends with a `Z`+3 country code.

---

## STANDARD KYB FILL (baseline)

**Azienda:** Codice Fiscale = P.IVA; Ragione sociale as given; Forma Giuridica = pick any code (e.g. `AA` — dropdown shows codes only); Codice SAE `430` (⚠️ unconfirmed, may be optional); ATECO as given; REA = province sigla (⚠️); Numero REA as given; Provincia di Iscrizione + Data Iscrizione as given.

**Sede:** legal seat as given; ☑ **L'indirizzo della sede operativa corrisponde alla sede legale** (checked); PEC as given; Prefisso `39` + company phone.

**Persone (each person):** identity fields + **Generate** CF; residence in Italy; ☑ **Il domicilio corrisponde alla residenza** (checked); Paese fiscale AML `Italia`; set **Ruolo** (Titolare effettivo and/or Firmatario) per case; Cittadinanza per case (Italiana unless stated → non-Italian triggers permit upload). Use **+ Add** for each additional person.

**PEP (each person's card):** default PEP unchecked / Status `No` / USA unchecked, unless the case sets a flag.

**AML (company):** tick ≥1 in each of Scopo del rapporto / Origine dei fondi / Destinazione fondi (≥2 where a case says "combinations"); set Nazione `Italia`, Regione (an Italian region), Ricavi annui, Patrimonio, Numero dipendenti.

**Documenti:** upload the company **Visura Camerale**; for each person set Tipo documento + Numero + rilascio/scadenza + Ente rilascio + Luogo, and upload their **ID image (PNG)**. **Procura** only if the signer is not the legal representative (skip in all cases below — the ES is the legal rep).

**Firma** → ES signs. **Video** → real liveness by the ES.

**Ente rilascio mapping:** Carta d'Identità → `Municipality`; Patente → `MCTC`; Passaporto → `Police Headquarter`.

---

## Dummy companies (one per case)

| Case | Company | P.IVA / CF | Visura file |
|---|---|---|---|
| TC0.13 | ROSSI & PARTNERS S.R.L. | `09876543019` | `3_visura_camerale_TEST.pdf` |
| TC0.14 | VERDI LOGISTICS S.R.L. | `11223344059` | `3b_visura_camerale_VERDI_TEST.pdf` |
| TC0.15 | NERI CONSULTING S.P.A. | `22334455080` | `3c_visura_camerale_NERI_TEST.pdf` |
| TC0.16 | BRUNO IMPORT-EXPORT S.R.L. | `33445566079` | `3d_visura_camerale_BRUNO_TEST.pdf` |
| TC0.17 | ALPI TRADING S.R.L. | `44556677068` | `3e_visura_camerale_ALPI_TEST.pdf` |
| TC0.18 | SOLE MARE S.R.L. | `55667788057` | `3f_visura_camerale_SOLEMARE_TEST.pdf` |
| TC0.19 | STELLA NORD S.R.L. | `66778899048` | `3g_visura_camerale_STELLANORD_TEST.pdf` |

Company details (sede / REA / ATECO / data iscrizione) are printed inside each Visura PDF — read them from there.

---

## TC0.12 — Document acknowledgment (pre-onboarding, merchant)
- **Goal:** at onboarding start the executor sees the 3 PDFs (Information Sheet + Contract, privacy notice, FEA), can open them, ticks the acknowledgment checkbox, confirms.
- **Action:** screenshot/video showing the 3 PDFs are visible and acknowledgeable.
- **Expected:** the 3 documents are viewable + acknowledgment recorded (ideally with timestamp).
- **⚠️ Blocker:** requires the final PDFs on staging. Confirm availability first.

---

## TC0.13 — ES = TE (one person, both roles); CIE; AML "combinations"
- **Company:** ROSSI & PARTNERS S.R.L.
- **People (1):**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | PEP | US | Document | ID file |
|---|---|---|---|---|---|---|---|---|---|
| Mario Rossi | **Titolare effettivo + Firmatario** | 15/03/1985 / M | Roma | `RSSMRA85C15H501R` | Italiana | No | No | Carta d'Identità `CA12345AB` (10/01/2022–09/01/2032, Roma) | `13a_cid_Rossi_ES_TEST.png` |

- **AML (≥2 in every section):** Scopo → `Gestione della tesoreria` + `Gestione ordinaria dell'attività`; Origine dei fondi → `Conferimenti da soci` + `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti`; Nazione `Italia`; Regione `Lazio`; Ricavi `200.001 – 500.000`; Patrimonio `500.001 – 800.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3_visura_camerale_TEST.pdf` + ID `13a_cid_Rossi_ES_TEST.png`.
- **Expected:** `CONFIRMED`.

---

## TC0.14 — ES ≠ TE; ES signs; ES = US taxpayer (W9); both driving license
- **Company:** VERDI LOGISTICS S.R.L.
- **People (2):**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | PEP | US | Document | ID file |
|---|---|---|---|---|---|---|---|---|---|
| Mario Rossi | **Firmatario** | 15/03/1985 / M | Roma | `RSSMRA85C15H501R` | Italiana | No | **Yes → W-9** | Patente `RM3344556Z` (08/07/2019–07/07/2029, Roma, MCTC) | `6_patente_ES_Rossi_TEST.png` |
| Luca Ferrari | **Titolare effettivo** | 03/11/1978 / M | Milano | `FRRLCU78S03F205L` | Italiana | No | No | Patente `MI7788990X` (15/05/2019–14/05/2029, Milano, MCTC) | `7_patente_TE_Ferrari_TEST.png` |

- **PEP step:** Mario Rossi → ☑ **Sono contribuente USA** → upload `2_form_W9_TEST.pdf`.
- **AML (focus country + region + revenue):** Scopo → `Gestione ordinaria dell'attività` + `Incasso fatture`; Origine dei fondi → `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti`; Nazione `Italia`; Regione `Lombardia`; Ricavi `200.001 – 500.000`; Patrimonio `500.001 – 800.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3b_visura_camerale_VERDI_TEST.pdf`; W-9 `2_form_W9_TEST.pdf`; IDs `6_patente_ES_Rossi_TEST.png`, `7_patente_TE_Ferrari_TEST.png`.
- **Expected:** `CONFIRMED`.

---

## TC0.15 — ES is one of the four TEs; ES = PEP; TE2 non-EU + permit
- **Company:** NERI CONSULTING S.P.A.
- **People (4):**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | PEP | Document | ID file |
|---|---|---|---|---|---|---|---|---|
| Giovanni Greco | **Titolare effettivo + Firmatario** | 20/04/1980 / M | Roma | `GRCGNN80D20H501V` | Italiana | **Yes** (Persona politica esposta) | Passaporto `YA2233445` (10/01/2021–09/01/2031, Roma, Police HQ) | `15a_passaporto_Greco_ES_TEST.png` |
| Sofia Marino | Titolare effettivo | 05/12/1986 / F | Milano | `MRNSFO86T45F205X` | Italiana | No | Passaporto `YB3344556` (05/03/2022–04/03/2032, Milano, Police HQ) | `15b_passaporto_Marino_TE1_TEST.png` |
| Ahmed Hassan | Titolare effettivo | 12/05/1988 / M | Il Cairo, Egitto | `HSSHMD88E12Z336L` | **Egiziana → permit** | No | Passaporto `A22334455` (01/03/2021–28/02/2028, Il Cairo, Ministry) | `15c_passaporto_Hassan_TE2_TEST.png` |
| Matteo Gallo | Titolare effettivo | 14/02/1979 / M | Torino | `GLLMTT79B14L219T` | Italiana | No | Passaporto `YC4455667` (20/03/2020–19/03/2030, Torino, Police HQ) | `15d_passaporto_Gallo_TE3_TEST.png` |

- **Ahmed Hassan (Persone):** Paese `Egitto`, Citta di nascita `Il Cairo`, Cittadinanza `Egiziana` → upload permit `1_permesso_di_soggiorno_TEST.pdf` (fixed-term).
- **PEP step:** Greco → ☑ PEP, Status `Persona politica esposta`, Tipo di Incarico `Deputato`, Nazione `Italia`, Status Incarico `inprogress`. Others `No`.
- **AML:** Scopo → `Gestione ordinaria dell'attività`; Origine dei fondi → `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti`; Nazione `Italia`; Regione `Lazio`; Ricavi `500.001 – 800.000`; Patrimonio `800.001 – 1.000.000`; Numero dipendenti `51-100`.
- **Files:** Visura `3c_visura_camerale_NERI_TEST.pdf`; permit `1_permesso_di_soggiorno_TEST.pdf`; IDs `15a`–`15d`.
- **Expected:** `CONFIRMED`.

---

## TC0.16 — ES ≠ four TEs; one TE PEP, one TE US(W9), one TE business-tie PEP; all ID cards
- **Company:** BRUNO IMPORT-EXPORT S.R.L.
- **People (5):**

| Person | Role | DOB / Sex | Birthplace | CF | PEP / US | Document | ID file |
|---|---|---|---|---|---|---|---|
| Paolo Romano | **Firmatario** | 09/06/1975 / M | Torino | `RMNPLA75H09L219B` | — | Carta d'Identità `CA10111AB` (03/02/2021–02/02/2031, Torino) | `16a_cid_Romano_ES_TEST.png` |
| Anna Esposito | Titolare effettivo | 28/01/1982 / F | Napoli | `SPSNNA82A68F839L` | **PEP** (Persona politica esposta) | Carta d'Identità `CA20222AB` (10/04/2022–09/04/2032, Napoli) | `16b_cid_Esposito_TE1PEP_TEST.png` |
| Chiara Costa | Titolare effettivo | 08/10/1991 / F | Napoli | `CSTCHR91R48F839S` | **US → W-9** | Carta d'Identità `CA30333AB` (15/06/2023–14/06/2033, Napoli) | `16c_cid_Costa_TE2US_TEST.png` |
| Elena Conti | Titolare effettivo | 17/09/1988 / F | Roma | `CNTLNE88P57H501J` | **Business tie w/ PEP** (Legami in affari) | Carta d'Identità `CA40444AB` (20/05/2022–19/05/2032, Roma) | `16d_cid_Conti_TE3_TEST.png` |
| Sofia Marino | Titolare effettivo | 05/12/1986 / F | Milano | `MRNSFO86T45F205X` | — | Carta d'Identità `CA50555AB` (05/03/2022–04/03/2032, Milano) | `16e_cid_Marino_TE4_TEST.png` |

- All Italian citizens, all Ente rilascio `Municipality`.
- **PEP step:**
  - Anna Esposito → ☑ PEP, Status `Persona politica esposta`, Tipo di Incarico `Sindaco di capoluogo di provincia o città metropolitana`, Nazione `Italia`, Status `inprogress`.
  - Chiara Costa → ☑ **Sono contribuente USA** → upload `2b_form_W9_Costa_TEST.pdf`.
  - Elena Conti → ☑ PEP, Status `Legami in affari con una persona politicamente esposta`, Tipo di Incarico `Senatore`, Nazione `Italia`, Status `inprogress`.
  - Paolo Romano, Sofia Marino → `No`.
- **AML:** Scopo → `Gestione ordinaria dell'attività` + `Incasso fatture`; Origine dei fondi → `Ricavi da attività` + `Conferimenti da soci`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti` + `Trasferimenti su Paesi Extra UE`; Nazione `Italia`; Regione `Campania`; Ricavi `500.001 – 800.000`; Patrimonio `500.001 – 800.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3d_visura_camerale_BRUNO_TEST.pdf`; W-9 `2b_form_W9_Costa_TEST.pdf`; IDs `16a`–`16e`.
- **Expected:** `CONFIRMED`.

---

## TC0.17 — ES EU citizen + PEP family member; TE EU citizen (conditional KO/OK)
- **Company:** ALPI TRADING S.R.L.
- **Conditional outcome:** **KO** if a foreign passport is used with no Italian residence; **OK** if born abroad but resident in Italy with Italian CF + Italian passport. The setup below is the **OK path**.
- **People (2) — OK path:**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | PEP | Document | ID file |
|---|---|---|---|---|---|---|---|---|
| Marco Bruno | **Firmatario** | 10/03/1983 / M | Parigi, Francia (EU) | `BRNMRC83C10Z110L` | **Italiana** | **PEP family member** (Familiare di una PEP) | Passaporto `YD5566778` (14/02/2022–13/02/2032, Roma, Police HQ) | `17a_passaporto_Bruno_ES_TEST.png` |
| Laura Neri | Titolare effettivo | 25/07/1987 / F | Berlino, Germania (EU) | `NRELRA87L65Z112P` | **Italiana** | No | Passaporto `YE6677889` (09/05/2023–08/05/2033, Milano, Police HQ) | `17b_passaporto_Neri_TE_TEST.png` |

- Both: Paese (nascita) = foreign EU country, **Paese di residenza `Italia`**, Cittadinanza `Italiana` (→ no permit, Italian passport → OK).
- **PEP step:** Marco Bruno → ☑ PEP, Status `Familiare di una persona politica esposta`, Tipo di Incarico `Deputato`, Nazione `Italia`, Status `inprogress`. Laura Neri → `No`.
- **AML:** Scopo → `Gestione ordinaria dell'attività`; Origine dei fondi → `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Trasferimenti su Paesi UE`; Nazione `Italia`; Regione `Lazio`; Ricavi `200.001 – 500.000`; Patrimonio `500.001 – 800.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3e_visura_camerale_ALPI_TEST.pdf`; IDs `17a`, `17b`.
- **Expected (OK path):** `CONFIRMED`.
- **KO variant:** set Cittadinanza to foreign (`Francese`/`Tedesca`) → permit upload appears; set Paese di residenza ≠ Italia; use a foreign passport → **KO**.
- **Note:** the sheet says TE is NOT a PEP; an earlier local note said TE is a PEP — this file follows the sheet (TE not PEP). Flip if required.

---

## TC0.18 — ES EU citizen; TE non-EU citizen (conditional KO/OK)
- **Company:** SOLE MARE S.R.L. · OK path below · no PEP in this case.
- **People (2) — OK path:**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | Document | ID file |
|---|---|---|---|---|---|---|---|
| Andrea Fontana | **Firmatario** | 18/06/1984 / M | Madrid, Spagna (EU) | `FNTNDR84H18Z131J` | **Italiana** | Passaporto `YF7788990` (14/02/2022–13/02/2032, Napoli, Police HQ) | `18a_passaporto_Fontana_ES_TEST.png` |
| Sara Galli | Titolare effettivo | 03/09/1990 / F | Il Cairo, Egitto (non-EU) | `GLLSRA90P43Z336L` | **Italiana** | Carta d'Identità `CA60666AB` (10/05/2023–09/05/2033, Roma, Municipality) | `18b_cid_Galli_TE_TEST.png` |

- Both: Paese (nascita) = foreign, Paese di residenza `Italia`, Cittadinanza `Italiana`.
- **PEP step:** both `No`, USA unchecked.
- **AML:** Scopo → `Gestione ordinaria dell'attività`; Origine dei fondi → `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti`; Nazione `Italia`; Regione `Campania`; Ricavi `200.001 – 500.000`; Patrimonio `200.001 – 500.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3f_visura_camerale_SOLEMARE_TEST.pdf`; IDs `18a`, `18b`.
- **Expected (OK path):** `CONFIRMED`.
- **KO variant:** Cittadinanza foreign (`Spagnola`/`Egiziana`) + residence abroad + foreign passport → **KO**.

---

## TC0.19 — ES non-EU citizen; TE non-EU citizen (conditional KO/OK)
- **Company:** STELLA NORD S.R.L. · OK path below · no PEP in this case.
- **People (2) — OK path:**

| Person | Role | DOB / Sex | Birthplace | CF | Cittadinanza | Document | ID file |
|---|---|---|---|---|---|---|---|
| Luca Moretti | **Firmatario** | 07/11/1981 / M | San Paolo, Brasile (non-EU) | `MRTLCU81S07Z602X` | **Italiana** | Passaporto `YG8899001` (14/02/2022–13/02/2032, Torino, Police HQ) | `19a_passaporto_Moretti_ES_TEST.png` |
| Nadia Ricci | Titolare effettivo | 22/04/1989 / F | Casablanca, Marocco (non-EU) | `RCCNDA89D62Z330N` | **Italiana** | Passaporto `YH9900112` (09/05/2023–08/05/2033, Torino, Police HQ) | `19b_passaporto_Ricci_TE_TEST.png` |

- Both: Paese (nascita) = foreign non-EU, Paese di residenza `Italia`, Cittadinanza `Italiana`.
- **PEP step:** both `No`, USA unchecked.
- **AML:** Scopo → `Gestione ordinaria dell'attività`; Origine dei fondi → `Ricavi da attività`; Destinazione → `Acquisti da fornitori` + `Pagamento dipendenti`; Nazione `Italia`; Regione `Piemonte`; Ricavi `200.001 – 500.000`; Patrimonio `200.001 – 500.000`; Numero dipendenti `11-50`.
- **Files:** Visura `3g_visura_camerale_STELLANORD_TEST.pdf`; IDs `19a`, `19b`.
- **Expected (OK path):** `CONFIRMED`.
- **KO variant:** Cittadinanza foreign (`Brasiliana`/`Marocchina`) + residence abroad + foreign passport → **KO**.

---

## Open items to confirm on staging (⚠️)
- Forma Giuridica: real mapping of 2-letter codes to legal forms (dropdown shows codes only).
- Codice SAE and REA / Numero REA: exact format, and whether they are mandatory.
- W-9 and residence-permit upload slots: whether they accept PDF (provided) or require JPG/PNG.

