# Account statement & მერჩანტის ანგარიშები — API ლოგიკა (v3)

წყარო: `FRONTEND-INTEGRATION-GUIDE-ACCOUNT-STATEMENT-V3.docx` (23/10/2026, ცვლის v2-ს 20/10-დან). Backend contact: **Megi**.
ტიკეტები: **KI-279 / KI-280 / KI-281 / KI-432 / KI-261** (+ KI-385 კონტრაქტი).

**v3-ში რა შეიცვალა (v2-თან შედარებით):**
- 🆕 მოძრაობის დეტალი counterparty-ით (payerName / beneficiaryName / causale / TRN) — `movementDescription`-ის პარსვა აღარ (§4.1)
- 🔁 drill-down, IBAN/საკომისიო, ქვითარი — გასაღები **`operationReference`**; `reference` მხოლოდ fallback (§3-5)
- 🆕 Incoming / Outgoing ფილტრი `direction`-ზე, **კლიენტში** (§3)
- 🆕 ქვითარი არ არსებობს → საკუთარი კოდი **2516** (§5)
- 🆕 Estratto conto + კონტრაქტი, **2515** "ჯერ არ არის" (§6)
- 🆕 ვებ-პორტალზეც იგივე endpoint-ები (§1)
- 🔁 **დღიური ლიმიტი არ არის** — "Limite giornaliero" ხაზი ქრება

---

## 1. საფუძველი

- Base path: **`/api/tppay`** — იგივე host და auth, რაც აპის სხვა call-ებს. TPPay-ს ტოკენს / contract / account id-ს ფრონტი **ვერასდროს** ხედავს.
- **პორტალი:** იგივე path-ები საკუთარ `/api/tppay`-ზე, იგივე პარამეტრები და error კოდები. Permission-ები:

| Permission | რას ფარავს |
|---|---|
| `PORTAL_ACCOUNT_STATEMENT_VIEW` | ბალანსი, მოძრაობების სია, estratto conto (§6) |
| `PORTAL_ACCOUNT_STATEMENT_DETAILS_VIEW` | მოძრაობის დეტალი (§4), ქვითარი (§5) |
| `PORTAL_TRANSFER_CREATE` | შიდა გადარიცხვები (§7) |

- წარმატება: `{ "value": { ... } }`
- შეცდომა: `{ "message": "...", "statusCode": 2507, "exceptionGroup": 1 }` — ლოგიკა **`statusCode`-ზე**, არა message-ზე (message მხოლოდ საჩვენებლად).
- **მენიუს ხილვადობა:** ბალანსის call → `2508` (403) = ამ პროფილს სტეიტმენტი არ აქვს → **მთელი სექცია იმალება**, ეს error არ არის.

**ვინ იძახებს:**
- **Customer** — ერთი wallet.
- **Merchant** (legal representative / master-branch login) — ორი ანგარიში:

| account | მნიშვნელობა |
|---|---|
| `PERSONAL` (B) | კორპორატიული ანგარიში ("Conto Dispositivo") |
| `TECHNICAL` (C) | e-money ანგარიში, რომელსაც გადახდის ფლოუები იყენებს ("Conto Oper Limitata") |

ფრონტი account id-ს არ აგზავნის — მხოლოდ `account=PERSONAL|TECHNICAL` სელექტორს. 🔁 სელექტორი მიიღება: სიაზე, დეტალზე, IBAN/საკომისიოზე, ქვითარზე → მერჩანტის ეკრანზე **ყოველთვის იმ ტაბის account, საიდანაც row მოვიდა**.

---

## 2. ბალანსი — `GET /api/tppay/account/balance`

`value` = სია: customer → **1 ელემენტი** (`account`, `iban` = null); merchant → **2** (PERSONAL + TECHNICAL).

```json
{ "account": "PERSONAL", "iban": "IT51D…5490", "available": "1.00", "expected": "1.00",
  "pending": "0.00", "currency": "EUR", "availableSign": "C", "asOf": "2026-10-19T11:57:52Z" }
```

| ველი | წესი |
|---|---|
| `available` | **მთავარი ციფრი** — "Available balance". სიიდან არ ითვლება. |
| `expected` | გვერდით, საკუთარი label-ით |
| `pending` | = expected − available → **"Movimenti in corso"** (KI-280). PENDING row-ების ჯამიდან **არ** ითვლება. ჩანს **მხოლოდ თუ ≠ "0.00"** (21/10). null = TPPay-მ ბალანსი არ დააბრუნა |
| `availableSign` | `D` = overdrawn → უარყოფითი სტილი (თვითონ თანხა unsigned-ია) |
| `asOf` | **ყოველთვის ჩანს** ("as at …") — compliance |
| — | **"Limite giornaliero" ხაზი არ უნდა იყოს** (21/10) |

---

## 3. მოძრაობების სია — `GET /api/tppay/account/movements`

```
?window=7|30|90
?fromDate=2026-05-01&toDate=2026-08-01&offset=0&limit=50
```

| პარამეტრი | წესი |
|---|---|
| `window` | მხოლოდ **7, 30, 90**. თარიღებთან ერთად არ მიიღება |
| `fromDate`/`toDate` | ISO, ორივე ერთად, **მაქს. 120 დღე** → სხვაგვარად `2507`. ლიმიტი picker-ში submit-მდე უნდა ჩანდეს |
| `offset` | **გვერდის ნომერი** (0-დან), არა ჩანაწერის offset. შემდეგი = offset+1 |
| `limit` | default 50 |
| `account` | PERSONAL (default) / TECHNICAL. TECHNICAL არა-მერჩანტზე → `2453`. მერჩანტი: **ცალ-ცალკე call თითო ანგარიშზე**, პარამეტრი ყოველთვის ცხადად |

Response: `lastReadAt`, `totalElements`, `totalPages`, `movements[]`. Row-ის ველები: `accountingDate`, `valueDate`, `insertedAt`, `state` (BOOKED/PENDING), `amount`, `currency`, `direction` (D/C), `operationType`, `fee`, `description`, `movementDescription`, `operationReference`, `reference`.

**რენდერის წესები (ყველა ტიკეტის მოთხოვნაა):**

| წესი | როგორ |
|---|---|
| თანხა unsigned | ნიშანი/ფერი `direction`-იდან: **D = გამავალი (−)**, **C = შემომავალი (+)** |
| Label-ები TPPay-სია | `description` / `movementDescription` **ზუსტად** როგორც მოდის, თარგმანის გარეშე |
| 🔁 `movementDescription` არ იპარსება | "Ben." / "Ord." / "Caus." / "Rif." აღარ ამოიღება — მოდის §4.1-დან |
| PENDING ჩანს | საკუთარი badge, არ იმალება/ნაცრისფერდება. თანხა არ იცვლება, state/თარიღი — შეიძლება |
| Fee ცალკე row-ია | `fee=true` row სიაშია; ჯგუფდება თავის გადარიცხვასთან **`operationReference`**-ით. collapse/indent — კი; შერწყმა/ჯამი — **არა** |
| სორტირება მზადაა | newest-first; `accountingDate`-ით ხელახლა **არ** ისორტება |
| `lastReadAt` | "updated at …" — ყოველთვის ჩანს |
| 🔁 drill-down `operationReference`-ით | ყველა row ხსნის დეტალს; **fee row ხსნის მშობელი გადარიცხვის დეტალს** |
| 🆕 Incoming/Outgoing | `direction`-ზე **კლიენტში** (TPPay ფილტრს იგნორირებს — 19/10). ვინაიდან სია გვერდებადაა: ფანჯრისთვის დიდი `limit` (მაგ. 500), ფილტრი მთელ ფანჯარაზე → counter / pagination / empty state **გაფილტრულ სიაზე** |
| Pagination | `totalPages`-ით; თუ totals = null → offset++ სანამ გვერდი `limit`-ზე ნაკლებს არ დააბრუნებს |
| ცარიელი გვერდი | `movements: []` + 200 = ნორმალური empty state, არა error |
| შიდა გადარიცხვა B↔C | **ორივე** ანგარიშის სიაში ჩვეულებრივი `SCT-P8-ONU-SEND/-RECE` row, fee 0.00, **fee row-ის გარეშე** |

> ფილტრები: მხოლოდ Incoming/Outgoing. ტიპით/სტატუსით/თანხით ფილტრი **არ არის** (§11).

---

## 4. მოძრაობის დეტალი

### 4.1 🆕 Counterparty + causale
`GET /api/tppay/account/movements/{operationReference}?account=PERSONAL|TECHNICAL` (customer-ზე account არ იგზავნება)

Response: `movement` (იგივე ველები რაც სიაში) + `payerName`, `beneficiaryName`, `reason`, `trn`, `bankReference`.

| ჩვენება | ველი |
|---|---|
| Beneficiary (გამავალი, D) | `beneficiaryName` |
| Sender (შემომავალი, C) | `payerName` |
| Causale | `reason` |
| TRN | `trn` (= label-ის "Rif.") |

IBAN და საკომისიო **აქ არ არის** → §4.2. `2039` = ამ ანგარიშზე ასეთი მოძრაობა არაა → fallback row-ის ფურცელზე, **toast-ის გარეშე**.

### 4.2 IBAN, საკომისიო, სტატუსი
`GET /api/tppay/account/movements/detail?reference={operationReference}&account=...` (🔁 TRN-იც მიიღება)

- Payload = `transactionONUS` **ან** `transactionSEPA` (რომელიც non-null; შიგნით ველები იგივეა).
- აქედან ჩანს: **commission**, `creditorAccount.iban`, `overallStatus`. სახელები/causale — §4.1-დან.
- **თანხა და საკომისიო ცალ-ცალკე ხაზზე** (acceptance criterion). საკომისიო = სიის fee row-ის იგივე თანხა — **არა დამატებითი**. ჩანს მხოლოდ თუ > 0.
- `2039` → fallback row-ზე, toast/retry-ის გარეშე.

---

## 5. ქვითარი (PDF) — `GET /api/tppay/account/movements/receipt?reference={operationReference}&account=...`

- 🔁 `reference` = `operationReference` (TRN-იც მიიღება). 🆕 მერჩანტზე `account` = row-ის ტაბი (TPPay-ს დებეტის ანგარიში სჭირდება).
- აბრუნებს PDF bytes (`application/pdf`, `Content-Disposition`).
- მუშაობს **გამავალზე (D)**.
- 🆕 `2516` (404) = ქვითარი არ არსებობს: **შემომავალი** და **~16/10/2026-მდე** შექმნილი ოპერაციები → "receipt unavailable" ჩუმად, retry არა.
- **შემომავალ (C) row-ზე ქვითრის ღილაკი იმალება**, მის ნაცვლად დეტალი (§4).

---

## 6. 🆕 დოკუმენტები (KI-261, KI-385)

### 6.1 Estratto conto
`GET /api/tppay/documents/periodics?year=2026&creationDateFrom=2026-01-01&creationDateTo=2026-10-23`
- ყველა პარამეტრი optional: default = მიმდინარე წელი, 1 იანვრიდან დღემდე.
- ჩამოტვირთვა: `GET /api/tppay/documents/periodics/download?documentId={businessKey.documentId}`
- **ცარიელი სია = ნორმაა** (TPPay-ს staging-ზე ჯერ არ ატვირთავს) → "no statements yet", არა error.
- ⚠️ ველები და download staging-ზე **ჯერ დაუდასტურებელია**.

### 6.2 კონტრაქტი
`GET /api/tppay/documents/contracts/latest` → ხელმოწერილი კონტრაქტის PDF.
`2515` (404) = ჯერ არ არის (TPPay აქვეყნებს onboarding-ის შემდეგ) → "Document not yet available".

---

## 7. შიდა გადარიცხვა მერჩანტის ანგარიშებს შორის (KI-432)

**ვის შეუძლია:** მხოლოდ მერჩანტს (legal representative-ის პროფილი). სხვა პროფილი → `2451` (403) → transfer UI იმალება. Customer-ს technical ანგარიში არ აქვს → `2453`.

**რას წერს იუზერი:** მხოლოდ **თანხას**. მიმართულებას endpoint განსაზღვრავს (B → C ან C → B).

**ვალიდაცია:** ფრონტი თანხას ადარებს ეკრანზე ნაჩვენებ ბალანსს. ბექენდიც ამოწმებს: თანხა > ხელმისაწვდომი ბალანსი → `2512`.

**პორტალზე:** იგივე path-ები, permission `PORTAL_TRANSFER_CREATE`.

### 7.1 Personal → Technical (B → C) — OTP-ით

**ნაბიჯი 1 — ტრანსფერის დაწყება**
```
POST /api/tppay/account/internal-transfer/personal-to-technical   { "amount": 1.00 }
→ { "value": { "transferId": 123, "status": "CHALLENGE", "otpRequired": true } }
```
ამ მომენტში TPPay **მაშინვე აგზავნის SMS OTP-ს** legal representative-ის რეგისტრირებულ ნომერზე. ფული ჯერ არ გადასულა (`CHALLENGE`).

**ნაბიჯი 2 — OTP-ის შეყვანა**
```
POST /api/tppay/account/internal-transfer/123/verify-otp   { "otp": "123456" }
→ { "value": { "transferId": 123, "status": "EXEC", "otpRequired": false } }
```
- `EXEC` = გადარიცხვა დასრულდა.
- სხვა status → ჩანს როგორც failed/pending (message-ით), **retry loop არ არის**.

**ნაბიჯი 2a — Resend (არასავალდებულო ღილაკი)**
```
POST /api/tppay/account/internal-transfer/123/resend-otp
→ { "value": { "transferId": 123, "status": "CHALLENGE", "otpRequired": true } }
```
- Resend კოდს **email-ზე** აგზავნის (რეგისტრირებულ მეილზე), SMS-ზე კი არა.
- ამის შემდეგ **SMS-ით მოსული კოდი უქმდება** და იუზერს ეს უნდა ეთქვას.
- Resend მუშაობს **მხოლოდ მანამ, სანამ OTP ერთხელ მაინც არასწორად შეიყვანება**. ამის შემდეგ error-ს აბრუნებს, ამიტომ არასწორი OTP-ის შემდეგ ღილაკი უნდა გაითიშოს.
- რამდენჯერ შეიძლება resend-ის გამოყენება, დოკუმენტაციაში **არ წერია**.

**არასწორი OTP**
- **ერთი არასწორი OTP ტრანსფერს აჩავარდებს** → `2444`.
- ფული **არ გადასულა**. იუზერმა **ახალი ტრანსფერი** უნდა დაიწყოს (ნაბიჯი 1-დან).

**საკომისიო:** ყოველთვის **0.00**, ამიტომ fee ხაზი არ ჩანს.

### 7.2 Technical → Personal (C → B) — OTP-ის გარეშე
```
POST /api/tppay/account/internal-transfer/technical-to-personal   { "amount": 1.00 }
→ { "value": { "transferId": 124, "status": "EXEC", "otpRequired": false } }
```
ერთი request და შედეგი მაშინვე. წარმატების შემდეგ **ორივე ბალანსი უნდა განახლდეს**.

### 7.3 სიაში როგორ ჩანს
B↔C გადარიცხვა **ორივე** ანგარიშის სიაში ჩანს ჩვეულებრივ row-ად (`SCT-P8-ONU-SEND` / `-RECE`): fee 0.00, fee row-ის გარეშე, სპეციალური რენდერის გარეშე.

### 7.4 ამ ფლოუს error-ები
| statusCode | HTTP | როდის | UI |
|---|---|---|---|
| 2451 | 403 | მერჩანტის legal rep არ არის | transfer UI იმალება |
| 2453 | 404 | technical ანგარიში არ აქვს | merchant-accounts UI იმალება |
| 2512 | 400 | თანხა > ბალანსი | message; ფორმაში წინასწარ ვალიდაცია |
| 2444 | 400 | OTP უარყოფილია, ტრანსფერი ჩავარდა | ახალი ტრანსფერი; ფული არ გადასულა |
| 2450 | 404 | უცნობი transferId | stale state → ეკრანის refresh |
| 2464 | 409 | TPPay-მ ტრანსფერი უარყო | message + retry ღილაკი |

---

## 8. Error კოდები

| statusCode | HTTP | მნიშვნელობა | UI |
|---|---|---|---|
| 2507 | 400 | ფანჯარა არასწორია (>120 დღე, შებრუნებული, ნახევარი range) | message როგორც არის; picker-შიც დაიბლოკოს |
| 2508 | 403 | სტეიტმენტი ამ პროფილზე არაა | მთელი სექცია იმალება, არა error |
| 2442 | 400 | TPPay სესია ამოიწურა | refresh/re-login → 1 retry |
| 2039 | 400 | ამ reference-ზე მოძრაობა/ტრანზაქცია არაა | fallback row-ზე (ზოგ row-ზე მოსალოდნელია) |
| 🆕 2516 | 404 | ქვითარი არაა (შემომავალი / ~16/10-მდე) | "receipt unavailable", retry არა |
| 🆕 2515 | 404 | კონტრაქტი ჯერ არაა | "Document not yet available" |
| 2272 | 400 | upstream ჩავარდა | retry ღილაკი. 🔁 ქვითრის არქონაზე **აღარ** ბრუნდება (→ 2516) |
| 2451 | 403 | caller არაა მერჩანტის legal rep | merchant-accounts/transfer UI იმალება |
| 2453 | 404 | technical ანგარიში არაა (customer) | merchant-accounts UI იმალება |
| 2512 | 400 | თანხა > ხელმისაწვდომი ბალანსი | message; ფორმაში წინასწარ ვალიდაცია |
| 2444 | 400 | OTP უარყოფილია — ტრანსფერი ჩავარდა | ახალი ტრანსფერი; ფული არ გადასულა |
| 2450 | 404 | უცნობი transferId | stale state → ეკრანის refresh |
| 2464 | 409 | TPPay-მ ტრანსფერი უარყო | message + retry |

---

## 9. ეკრანის ფლოუ (მოკლედ)

```
სტეიტმენტის გახსნა  → GET /account/balance            (2508 → დამალე; 1 = customer, 2 = merchant)
                    → GET /account/movements?window=7  (+ &account=... თითო ტაბზე, მერჩანტი)
ფანჯრის შეცვლა      → window=30|90 ან fromDate&toDate
incoming/outgoing   → loaded row-ების ფილტრი direction-ზე (მთელი ფანჯარა, დიდი limit)
scroll              → offset+1, სანამ offset < totalPages
row-ზე tap          → GET /account/movements/{operationReference}?account=...          (სახელები, causale, TRN)
                    → GET /account/movements/detail?reference={operationReference}&...  (IBAN, საკომისიო)
ქვითარი             → GET /account/movements/receipt?reference={operationReference}&... (2516 = არაა)
estratto conto      → GET /documents/periodics → /documents/periodics/download?documentId=...
კონტრაქტი           → GET /documents/contracts/latest  (2515 = ჯერ არაა)
export              → ლოკალურად, უკვე ჩამოტვირთული row-ებიდან
მერჩანტი B → C      → personal-to-technical → OTP → verify-otp
მერჩანტი C → B      → technical-to-personal → ბალანსების refresh
```

---

## 10. CSV / Excel export

- **კლიენტზე**, უკვე ჩამოტვირთული row-ებიდან. ახალი backend/TPPay call **არა** — compliance: TPPay-ს სტეიტმენტის მოთხოვნა იუზერს **stamp duty**-ს ახდევინებს.
- Label: courtesy extract, **არა ფისკალური დოკუმენტი**.
- ზუსტად query-ის ფანჯარა, unsigned თანხა + direction სვეტი, fee ცალკე row-ებად.

---

## 11. ცნობილი შეზღუდვები (ბაგი არ არის)

| შეზღუდვა | მდგომარეობა |
|---|---|
| ფილტრები | მხოლოდ Incoming/Outgoing (`direction`, კლიენტში). ტიპი/სტატუსი/თანხა — არა |
| Label-ები მხოლოდ იტალიურად | IT/EN — ღია პროდუქტის გადაწყვეტილება; verbatim |
| ქვითარი შემომავალზე/ძველზე | არაა → 2516; TPPay ადასტურებს შემომავალს |
| Estratto conto staging-ზე | ჯერ ცარიელია, download დაუდასტურებელი |
| თარიღის ფილტრი `accountingDate`-ზე | პარასკევს გაკეთებული, ორშაბათს დასეტლებული პარასკევის ძიებაში **არ** ჩანს — ლოკალურად არ კომპენსირდება |

