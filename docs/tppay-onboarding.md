# TPPay Onboarding — Test Cases

**წყარო:** `TPPay_Checklist TEST staging_Partner_v18 ENG` (Google Sheet) → **Onboarding** tab.
TPPay-ის მიერ მოწოდებული დოკუმენტაცია, რის მიხედვითაც ვაონბორდებთ იუზერებს (Business & Individual).

> ეს ფაილი სქრინებიდან ზუსტად გადმოწერილი ქეისებია. სვეტები: **ID | Scenario | Expected (callback / outcome)**.

---

## Legend / აბრევიატურები

| აბრ. | მნიშვნელობა |
|---|---|
| **ES** | Soggetto Esecutore — ხელმომწერი/შემსრულებელი (executor / signer) |
| **TE** | Titolare Effettivo — ბენეფიციარი მფლობელი (beneficial owner) |
| **CIE** | Carta d'Identità Elettronica — ელექტრონული პირადობა |
| **W9** | US taxpayer form — ამერიკის საგადასახადო რეზიდენტი |
| **CF** | Codice Fiscale — იტალიური საგადასახადო კოდი |
| **NDG / IBAN** | ანგარიშის იდენტიფიკატორები (callback-ში `<valore>` = გენერირებული მნიშვნელობა) |

**Callback ტიპები:**
- ✅ `type: "ONBOARDING_RESULT", result: "CONFIRMED", ndg: "<valore>", iban: "<valore>"` — წარმატებული ონბორდინგი
- KYC esito: `event: <esito positivo | negativo | KO>` + `reason: <codice errore>` — KYC-ის შედეგი

---

## Individual / dokumentის ტიპები (Happy path — CONFIRMED)

| ID | Scenario | Expected |
|---|---|---|
| **TC0.2** | User onboarding using a valid **CIE (Electronic Identity Card)** | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.3** | User onboarding using a valid **paper identity card** | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.4** | User onboarding using a valid **driving license** | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.5** | User onboarding using a valid **passport** | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.6** | User onboarding using a valid **Italian passport**, with citizenship (i.e., Country of Birth) in a **non-EU country or the UK**. Scenario where a **residence permit** is also provided. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |

---

## KYC — Negative / edge (esito KYC)

| ID | Scenario | Expected |
|---|---|---|
| **TC0.7** | User onboarding using a **CIE where the declared personal details differ** from those shown on the identity document. | KYC esito → `event: <esito negativo>`, `reason: <codice errore>` |
| **TC0.8** | User onboarding using a valid paper identity card and **uploading only the front photo** of the ID card. The front photo is uploaded both for the front and for the back. | KYC esito → `event: <esito negativo>`, `reason: <codice errore>` |
| **TC0.9** | **Complete TC08** by invoking the "**data upload/update API**" and uploading the **correct ID card images** for both front and back. | KYC esito → `event: <esito positivo>` |
| **TC0.10** | User onboarding using a valid **driving license and declaring PEP status**. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.11** | User onboarding using a valid driving license, **without final contract signature**. | KYC esito → `event: <esito KO>`. Account not opened; the case moves to **expired** status after **30 days**. |

---

## Business — ES / TE combinations

> ყველა TE-სთვის: მათი დეტალები უნდა იყოს კონტრაქტში და ID დოკუმენტი ატვირთული (როგორც company register extract-ისთვის).

| ID | Scenario | Expected |
|---|---|---|
| **TC0.13** | Onboarding where the **ES matches the TE**; in the questionnaire select: combinations of **Relationship purpose**, **Source of funds**, **Destination of funds**. Use the **CIE** to identify both the ES and the TE. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) <br>_es. data: 01/12/2024 09:00 · user NDG (123), Idinternal (876)_ |
| **TC0.14** | Onboarding where the **ES is different from the TE**, and the **contract is signed by the ES**. Indicate ES as a **U.S. taxpayer (W9)**. In the questionnaire select: combinations of **Geographic country**, **Geographic region** (activity), **Annual revenues**. Use the **driving license** to identify both ES and TE. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.15** | Onboarding where the **ES is one of the four TEs** and: **ES holds a PEP position**, **TEs do not hold a PEP position**. Use the **passport** for ES and TE1, a **fixed-term residence permit** for TE2, and an **indefinite-term passport** for TE3. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |
| **TC0.16** | Onboarding where the **ES is different from the four TEs**: **ES does not hold a PEP position**, **one of the TEs holds a PEP position**, **one of the 4 TEs is a U.S. taxpayer (W9)**, **one of the 4 TEs has business ties with a PEP**. | `ONBOARDING_RESULT` → **CONFIRMED** (ndg, iban) |

---

## Citizenship / residence (EU / non-EU)

| ID | Scenario | Expected |
|---|---|---|
| **TC0.17** | Onboarding where: **ES is an EU citizen and is a PEP family member**, while **TE is an EU citizen but NOT a PEP**. | **KO** if a foreign passport is used (i.e., no residence in Italy). <br>**OK** if the user was born abroad BUT is resident in Italy (i.e., has an Italian CF and an Italian passport). |
| **TC0.18** | Onboarding where the **ES is an EU citizen**, while the **TE is a non-EU citizen**. | **KO** if a foreign passport is used (no residence in Italy). <br>**OK** if born abroad BUT resident in Italy (Italian CF + Italian passport). |
| **TC0.19** | Onboarding where the **ES is a non-EU citizen** and the **TE is a non-EU citizen**. | **KO** if a foreign passport is used (no residence in Italy). <br>**OK** if born abroad BUT resident in Italy (Italian CF + Italian passport). |

---

## ⚠️ სქრინებში არ ჩანდა (დასაზუსტებელი)

- **TC0.1** — row 3 (partially cut): "...available on the Transparency page, together with the Bank of Italy documents available at this link" (Transparency page ტესტი — სრული ტექსტი მოსაწოდებელი).
- **TC0.12** — სქრინებში გამოტოვებულია (TC0.11 → TC0.13 შორის).

> სხვა tab-ები (Payment account transactions · 21, EM topup and withdraw · 12, Open issues, Issues) — ცალკე დასამატებელი.

---

## რას ვფარავთ ავტომატიზაციით (მიმდინარე სტატუსი)

| ქეისი | Playwright ტესტი | სტატუსი |
|---|---|---|
| TC0.2 (CIE / Carta d'Identità) | `tests/Tppay-Individual/kyc-onboarding.spec.ts` | ✅ |
| TC0.4 (driving license) | `tests/Tppay-Individual/kyc-onboarding.spec.ts` | ✅ |
| TC0.5 (passport) | `tests/Tppay-Individual/kyc-onboarding.spec.ts` | ✅ |
| TC0.10 (PEP declared) | `tests/Tppay-Individual/kyc-pep.spec.ts` | ✅ (4 PEP ვარიაცია) |
| Business (Wallet KYB) | `tests/Tppay-Business/business-onboarding.spec.ts` | 🚧 AML-მდე |