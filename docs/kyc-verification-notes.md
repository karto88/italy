# KYC Verification — შენიშვნები და ვალიდაციები

KYC ვერიფიკაციის flow-ს მნიშვნელოვანი წესები, ვალიდაციები და სამომავლო ტესტ-ქეისები.

---

## 1. Codice Fiscale — "Generate" ღილაკი

Codice Fiscale-ს (იტალიური საგადასახადო კოდი) წინასწარ გენერაცია **შესაძლებელია მხოლოდ მას შემდეგ**, რაც შევსებულია შემდეგი ველები:

- ✅ **Sesso** (სქესი)
- ✅ **Data di nascita** (დაბადების თარიღი)
- ✅ **Nazionalità** (ეროვნება)
- ✅ **Provincia di nascita** (დაბადების პროვინცია)
- ✅ **Comune di nascita** (დაბადების კომუნა)

თუ ეს ველები შევსებული არ არის, **"Generate" ვერ დააგენერირებს** კოდს.

**ტესტ-ქეისი:** შეამოწმე რომ Generate დაბლოკილია/error-ს იძლევა სანამ ეს ველები ცარიელია.

---

## 2. CAP di residenza (საფოსტო კოდი) — ვალიდაცია

- **მინიმუმი:** 4 სიმბოლო
- **მაქსიმუმი:** 10 სიმბოლო

**Boundary Value ტესტ-ქეისები:**

| შემავალი | სიგრძე | მოსალოდნელი |
|----------|--------|-------------|
| `123` | 3 | ❌ invalid (min-1) |
| `1234` | 4 | ✅ valid (min) |
| `1234567890` | 10 | ✅ valid (max) |
| `12345678901` | 11 | ❌ invalid (max+1) |

---

## 3. Cittadinanza (მოქალაქეობა) — ქეისები

ამჟამად ტესტში ვირჩევთ **Italia**-ს (მარტივი ქეისისთვის). მაგრამ საჭიროა ცალკე ქეისები:

- 🇮🇹 **იტალია** — მარტივი ქეისი (ამჟამად ავტომატიზებული)
- 🇪🇺 **EU მოქალაქეობა** (არა-იტალია) — შესამოწმებელი
- 🌍 **არა-EU მოქალაქეობა** — სავარაუდოდ დამატებითი ველები/დოკუმენტები ჩნდება (permesso di soggiorno და ა.შ.)

**TODO:** არა-EU ქეისზე დამატებითი ველების flow უნდა შემოწმდეს და დაემატოს.

---

## 4. პირველი გვერდის ველების თანმიმდევრობა (Personal Data)

1. Sesso (dropdown) → M/F
2. Data di nascita (masked textbox) → ddmmyyyy
3. Nazionalità (dropdown)
4. Provincia di nascita (dropdown)
5. Comune di nascita (dropdown)
6. **Generate** (Codice Fiscale)
7. Paese di residenza (dropdown)
8. Provincia di residenza (dropdown)
9. Comune di residenza (dropdown)
10. Via di residenza — ქუჩა (textbox)
11. Numero civico di residenza — ნომერი (textbox, obbligatorio)
12. CAP di residenza (textbox, 4-10)
13. "Il domicilio corrisponde alla..." (checkbox — domicile == residence)
14. Cittadinanza (dropdown)
15. Paese fiscale AML (dropdown)
16. radio "No"
17. **Avanti** (გაგრძელება)

---

*Page Object: `pages/KycPersonalDataPage.ts` | Config: `config/portal.config.ts` → `TEST_DATA.kycPersonal`*

---

## 5. დოკუმენტის გვერდი (Document)

### Tipo di documento (დოკუმენტის ტიპი) — ქეისები

| ტიპი | სტატუსი |
|------|---------|
| **Carta d'Identità** (პირადობა) | ✅ ავტომატიზებული (ამჟამინდელი) |
| **Patente** (მართვის მოწმობა) | ⏳ ქეისი საჭიროა |
| **Passaporto** (პასპორტი) | ⏳ ქეისი საჭიროა |

### Autorità di rilascio (გამცემი ორგანო) — ქეისები

დროფდაუნის ვარიანტები (თითო შეიძლება კონკრეტულ დოკუმენტის ტიპს შეესაბამებოდეს):

- **MCTC** — (ჩვეულებრივ Patente / მართვის მოწმობა)
- **Italian Representation Abroad** — (საზღვარგარეთ გაცემული)
- **Ministry** — (სამინისტრო)
- **Police Headquarter** — Questura (ჩვეულებრივ Passaporto / პირადობა)

**TODO:** შესამოწმებელია რომელი authority რომელ document type-თან არის ვალიდური (decision table).

### თარიღების ვალიდაცია (Data di rilascio / scadenza)

- **გაცემის თარიღი** წარსულში უნდა იყოს
- **ვადის თარიღი** მომავალში უნდა იყოს (და > გაცემის თარიღი)
- **TODO:** boundary/negative ქეისები — ვადაგასული დოკუმენტი, გაცემა მომავალში, scadenza < rilascio

### ველების თანმიმდევრობა

1. Tipo di documento (dropdown)
2. Numero del documento (textbox)
3. Data di rilascio del documento (date)
4. Data di scadenza del documento (date)
5. Luogo di rilascio (textbox)
6. Autorità di rilascio (dropdown)

*Page Object: `pages/KycDocumentPage.ts` | Config: `TEST_DATA.kycDocument`*