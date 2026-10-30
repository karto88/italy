# Keepz Italy — ფლოუების მიმოხილვა (Cash · Gaming · SEPA · QR)

წყარო: `Keepz Italy Flows(1).pdf` (Desktop/it doc/). ეს დოკუმენტი აღწერს TP Pay-ს ყველა ოპერაციულ ფლოუს ბიზნეს-დონეზე (ვინ ვისზე ფულს აგზავნის, სად სჭირდება OTP/SCA).

**საბაზისო ანგარიშების ტიპები:**
- **TP Pay Wallet: Personal** — ინდივიდის/მერჩანტის/gaming company-ის ძირითადი ანგარიში (ბალანსი რეალურად ინახება აქ)
- **TP Pay Wallet: Technical** — მერჩანტის ტექნიკური ანგარიში, **ყოველთვის ნულოვანი ბალანსი** — ცნაცილი "pass-through" ანგარიშია ქეშის ოპერაციებში
  - ⚠️ რეალურად (DEV, 10/2026) Technical **ნულოვანი არ არის** და cash-in-ისთვის წინასწარ უნდა შეივსოს — იხ. „რეალური ქცევა" ბოლოში.

---

## 1. Wallet Operations — Cash ↔ Wallet

### (1) Cash to Wallet: Top Up
ინდივიდი მიდის თამბაქოში (tabaccheria), აძლევს მერჩანტს ნაღდ ფულს → ეს თანხა ინდივიდის wallet-ში ჯდება.

**ნაბიჯები:**
1. ინდივიდი აძლევს მერჩანტს (tabacchino) ნაღდ ფულს (მაგ. $10)
2. მერჩანტი ააქტიურებს QR-ს და ქმნის order-ს
3. მერჩანტი ამოწმებს ინდივიდის იდენტობას QR-ით — ინდივიდი სკანირებს Keepz აპით
4. ფული გადადის **Merchant Personal → Merchant Technical** (pre-funded → ყოველთვის ნული)
   - ⚠️ **ამ ნაბიჯს OTP არ სჭირდება**
5. ფული გადადის **Merchant Technical → Individual Personal**

### (2) Wallet to Cash: Withdrawal
ინდივიდი moითხოვს ნაღდი ფულის გატანას თავისი wallet-იდან.

**ნაბიჯები:**
1. ინდივიდი ითხოვს $10-ს თავისი TP Pay Wallet-იდან
2. მერჩანტი ააქტიურებს QR-ს, ქმნის order-ს
3. მერჩანტი ამოწმებს იდენტობას QR-ით
4. ფული გადადის **Individual Personal → Merchant Personal**
   - ✅ **აქ სჭირდება SCA**: TP Pay უგზავნის OTP-ს მომხმარებელს, ის ადასტურებს
5. მერჩანტი აძლევს ნაღდ ფულს კლიენტს

---

## 2. Gaming Operations — Cash/Wallet ↔ Gaming Company

ეს ოთხივე ფლოუ დამატებით რთავს **Nuvei/Exalogic**-ს (ინტეგრირებული Keepz-თან) და **Gaming Company**-ს (ონბორდილი Keepz-თან — მაგ. Sunbet).

### (3) Cash to Gaming Company: Top Up
იგივეა რაც (1), მაგრამ ბოლოს ფული აგრძელებს გზას გეიმინგ კომპანიამდე.

**ნაბიჯები (1-6 იგივეა რაც Cash to Wallet):**
1-3. მერჩანტთან ნაღდის მიცემა + QR სკანი
4. ინდივიდი ეუბნება მერჩანტს, რომელ gaming company-ს ეხება → **Keepz ეკითხება Nuvei/Exalogic-ს**, დარეგისტრირებულია თუ არა (მაგ. "Beso" — Sunbet-ზე)
5. **Merchant Personal → Merchant Technical** (OTP არ სჭირდება)
6. **Merchant Technical → Individual Personal**
7. **Individual Personal → Gaming Personal**
   - ✅ **SCA საჭიროა**
8. **Keepz ეუბნება Nuvei/Exalogic-ს, რომ შეატყობინოს Sunbet-ს** — ტოპ-აფი გეიმინგ პლატფორმის ანგარიშზე

### (4) Gaming Company to Cash: Withdrawal
საწინააღმდეგო მიმართულება — გეიმინგ ანგარიშიდან ნაღდი ფული.

**ნაბიჯები:**
1-4. ინდივიდი ითხოვს გატანას → QR/იდენტობის შემოწმება → Keepz ამოწმებს Nuvei/Exalogic-ით registration-ს
5. **Gaming Personal → Individual Personal**
   - ⚠️ **OTP არ სჭირდება** — TP Pay-ს აქვს **სპეციალური შეთანხმება** გეიმინგ კომპანიებთან
6. **Individual Personal → Merchant Personal**
   - ✅ **SCA საჭიროა**
7. მერჩანტი აძლევს ნაღდ ფულს
8. **Keepz ატყობინებს Nuvei/Exalogic-ს → Sunbet-ს**, რომ თანხა გამოაკლოს Beso-ს გეიმინგ ანგარიშს

### (7) Wallet to Gaming Company: Top Up (Online)
ეს არის **online** ფლოუ (არა ფიზიკური მაღაზია) — ინდივიდი პირდაპირ Sunbet-იდან ტოპ-აფავს.

**ნაბიჯები:**
1. ინდივიდი შედის Sunbet ანგარიშზე → Top Up → ირჩევს თანხას → ირჩევს **Keepz**-ს (თუ კონკრეტულად TP Pay Wallet-იდან სურს)
2. Gaming Platform ეკითხება Nuvei/Exalogic-ს, არის თუ არა საკმარისი თანხა wallet-ზე
3. Nuvei/Exalogic ამოწმებს Keepz-თან → Keepz ეუბნება "OK" და აგზავნის ლინკს ოპერაციის დასასრულებლად → Nuvei/Exalogic უგზავნის ლინკს Sunbet-ს → Sunbet რედირექტავს მომხმარებელს
   - **ტელეფონზე** (Keepz app დაყენებული) → Keepz app იხსნება, ოპერაციის summary ჩანს
   - **კომპიუტერზე** → QR გენერირდება, მომხმარებელი სკანირებს
4. მომხმარებელი ადასტურებს + **SCA**
5. Keepz ატყობინებს Nuvei/Exalogic-ს წარმატებაზე → ეს ატყობინებს Sunbet-ს
6. Sunbet აირეკლავს (ტოპ-აფავს) თანხას მომხმარებლის Sunbet ანგარიშზე

### (8) Gaming Company to Wallet: Withdrawal (Online)
საწინააღმდეგო — Sunbet-იდან wallet-ში გატანა.

**ნაბიჯები:**
1. ინდივიდი → Sunbet → Withdraw → თანხა → Keepz
2. Gaming Platform ამოწმებს, არის თუ არა საკმარისი თანხა გეიმინგ ანგარიშზე
3. Nuvei/Exalogic ეუბნება Keepz-ს გადაიტანოს ფული → Keepz ატყობინებს წარმატებაზე → Nuvei/Exalogic ატყობინებს Sunbet-ს
4. Sunbet აირეკლავს (აკლებს) თანხას მომხმარებლის ანგარიშიდან

---

## 3. Money Transfers — SEPA / IBAN გადარიცხვები

### Internal (Wallet → Wallet, TP Pay შიგნით)
Individual 1 უგზავნის ფულს Individual 2-ს — **მიმღების TP Pay Wallet უნდა ჰქონდეს** (Keepz-ით შექმნილი თუ არა — არ აქვს მნიშვნელობა).

**ნაბიჯები:**
1. Individual 1 ხსნის Keepz App-ს, შეაქვს მიმღების:
   - IBAN
   - სახელი
   - Description
2. ფული პირდაპირ გადადის **Individual 1 Personal → Individual 2 Personal**

### External (Wallet → გარე IBAN)
Individual 1 უგზავნის ფულს ისეთ IBAN-ს, რომელიც Keepz-ზე არ არის ონბორდილი.

**ნაბიჯები:**
1. Individual 1 ავსებს IBAN + სახელი + Description
2. **VoP შემოწმება** ხდება, შემდეგ ჩანს OK/KO
3. თუ OK — ფული გადადის გარე IBAN-ზე

**VoP-ის 4 შედეგი (ეს ბიზნეს-წყაროა იმ ტესტ-ქეისებისთვის, რაც KI-285-ზე ვწერდით):**
| შედეგი | რას ნიშნავს |
|---|---|
| IBAN და სახელი ემთხვევა | **წარმატება** პირდაპირ |
| IBAN და სახელი ოდნავ არ ემთხვევა | წინადადება სწორი სახელით → წარმატება, თუ მომხმარებელი აგრძელებს |
| IBAN და სახელი საერთოდ არ ემთხვევა | გაფრთხილება → წარმატება, თუ მომხმარებელი მაინც აგრძელებს |
| IBAN ვერ მოიძებნა | **Error** |

*(შენიშვნა: ეს დოკუმენტი მხოლოდ 4 შედეგს ასახავს — KI-285-ის PDF mockup-ებში მეხუთე შედეგიც იყო, "VOP Error"/ტექნიკური შეცდომა — ეს დოკუმენტი ალბათ სქემატურ/გამარტივებულ ვერსიას აღწერს.)*

---

## 4. QR Payments — Product Purchase

ინდივიდი მაღაზიაში ყიდულობს პროდუქტს, მერჩანტის QR-ს სკანირებით.

**ნაბიჯები:**
1. მომხმარებელი ირჩევს პროდუქტს
2. მერჩანტი ააქტიურებს QR-ს
3. მომხმარებელი სკანირებს QR-ს — **ორი გზა**, თითოეულს განსხვავებული შესაძლებლობები:

| სკანირების მეთოდი | მერჩანტი მხოლოდ TP Pay-ზეა | მერჩანტი TP Pay + Nuvei-ზეა |
|---|---|---|
| **კამერით** (browser/web) | ❌ გადახდა ვერ სრულდება | ✅ Card / Apple Pay / Google Pay |
| **Keepz App-ით** | ✅ მხოლოდ TP Pay Wallet-იდან | ✅ Card / Apple Pay / Google Pay / **TP Pay Wallet** |

**⚠️ მნიშვნელოვანი წესი:** მომხმარებელს **ვერასდროს** შეუძლია გადაიხადოს TP Pay Wallet-იდან **web/browser**-ის საშუალებით (თუნდაც მერჩანტი TP Pay-ზე ონბორდილი იყოს) — **მიზეზი: იტალიაში მკაცრი უსაფრთხოების მოთხოვნები** ტექნიკურ და ფინანსურ სირთულეებს ქმნის. TP Pay Wallet-იდან გადახდა **მხოლოდ Keepz App-შია შესაძლებელი**.

---

## 5. რეალური ქცევა (DEV, ოქტომბერი 2026) — Jira + API

> წყარო: KI-118, KI-251, KI-279, KI-398, KI-430, KI-432 + Integration guide v2 + რეალური API პასუხები.
> აქ მხოლოდ ის წერია, რაც ზემოთ (PDF-ში) არ არის ან მისგან განსხვავდება.

### 5.1 მერჩანტის ორი ანგარიში (KI-432)
| ანგარიში | TPPay | რისთვის |
|---|---|---|
| **Personal** (B, `CO_CORP_01`, „Conto Dispositivo") | `account=PERSONAL` | ძირითადი ფული; **QR გადახდები აქ შემოდის** (დადასტურდა: Personal +5.00) |
| **Technical** (C, `CO_MOEL_01`, „Conto Oper Limitata") | `account=TECHNICAL` | cash ფლოუები |

- Personal → Technical: **OTP-ით** (SMS ან email — `resend-otp`); Technical → Personal: **OTP-ის გარეშე**. საკომისიო ორივეზე 0.00.

### 5.2 ⚠️ სად განსხვავდება PDF-ისგან
1. **Cash to Wallet (1):** PDF — Merchant Personal → Technical ავტომატურად. რეალურად Technical = 0-ზე cash-in **ჩავარდა**: `2512` „The merchant technical account holds 0.00 … top up the technical account" — მერჩანტმა ჯერ ხელით უნდა გადაიტანოს Personal → Technical.
2. **Wallet to Cash (2):** PDF — ფული → Merchant **Personal**. რეალურად `SCT-P8-ONU-RECE-CWIT` მერჩანტის **Technical**-ის სიაშია; Giacomo (KI-118): „for a CWIT: the merchant's account C".

### 5.3 `operationType` კოდები
| კოდი | ფლოუ | ტექსტი (TPPay) | Fee |
|---|---|---|---|
| `SCT-P8-ONU-SEND-CTUP` / `…-RECE-CTUP` | (1) Cash → Wallet | Addebito conto Gestore / Accredito conto Cliente per Ricarica con contante | 0.00 |
| `SCT-P8-ONU-SEND-CWIT` / `…-RECE-CWIT` | (2), (4) Cash withdrawal | Addebito conto Cliente per Prelievo contante | **2.00** |
| `SCT-P8-ONU-SEND-WTUP` | (7) Wallet → Gaming | Addebito conto Cliente per Ricarica online del conto gioco | 0.00 |
| `SCT-P8-ONU-RECE-WWIT` | (4), (8) Gaming → Wallet | Accredito conto Cliente per Prelievo da conto gioco | 0.00 |
| `SCT-P8-ONU-SEND` / `…-RECE` | Internal SEPA, KI-432 | Bonifico eseguito su Vostro ordine / Accredito bonifico (ONUS) | 0.00 |
| `SCT-P8-DEP-SEND` | External SEPA | Bonifico eseguito su Vostro ordine (DEPO) | **1.00** |
| `SCT-P8-DEP-REJE` | External SEPA — უარყოფა | Ri-accredito … esito negativo (თანხა + fee ბრუნდება) | — |
| `FEE-…` | საკომისიო | ცალკე სტრიქონი (`fee: true`), მშობელთან `operationReference`-ით | — |

- ONUS (შიდა) მოძრაობები მაშინვე **BOOKED**-ია. External SEPA staging-ზე ~30 წთ-ში უარყოფილია (REJE); სიაში BOOKED / „Completed", დეტალი `ERRR` — KI-452.

### 5.4 Gaming — კომპანიის მინიჭება მერჩანტზე (KI-398)
- ადმინი: `PUT newadmin…/api/v1/merchant/update` → `gamingAccess: { serveAll: true }` ან `{ serveAll: false, gamingCompanyIds: [...] }`.
- კომპანიის სტატუსი: `ACTIVE` / `TEMPORARILY_UNAVAILABLE` / `INACTIVE` (`null` = ACTIVE) — `PUT …/gaming-company/{id}`.
- მერჩანტის picker (`GET walletportal…/api/tppay-admin/gaming-companies`): მხოლოდ **მინიჭებული ACTIVE** კომპანიები.
- Serve all → Serve selected: ძველი არჩევანი **არ რჩება** — თავიდან უნდა მონიშნო.
- ონლაინ top-up (7): `/confirm-transaction?requestId={onlineOperationId}` → `operationId`; OTP resend-ზე **ეს `operationId`** უნდა წავიდეს (KI-453).

### 5.5 Refund (KI-118)
- **Refund-ი ფულს უბრუნებს მას, ვინც გადაიხადა** → მხოლოდ **გამავალი (D)** მოძრაობა; შემოსულზე `CRDT_404_AP_0004` მოსალოდნელია.
- `completeDraftRefundOperation` → `createRefundOperation` (POST, `amount` სავალდებულოა) → `…/operations/{id}/auth`; ერთ სესიაში.
- refund ≤ თავდაპირველზე; თავდაპირველი fee **არ ბრუნდება**. ✅ CWIT მუშაობს; ⏳ CTUP — დაბლოკილი.

### 5.6 ქვითარი (KI-430)
- მხოლოდ **გადამხდელისთვის** (D). შემოსულზე ღილაკი არ უნდა ჩანდეს.
- ⚠️ `SEND-WTUP`-ზე (გამავალი gaming) `404 / 2516` — შესამოწმებელია.

### 5.7 Endpoint-ები
| რა | Endpoint |
|---|---|
| Login (portal) | `exists` → `pre-login` → `validate-and-send-otp` → `web-resend-otp/fallback` → `web-login` (`walletportal.dev.keepz.it/api/v1/auth/…`) |
| ბალანსი / მოძრაობები | `GET gateway.dev.keepz.it/payment-service/api/tppay/account/balance` · `…/movements?window=7\|30\|90&account=PERSONAL\|TECHNICAL` |
| დეტალი / ქვითარი | `…/movements/detail?reference=` · `…/movements/receipt?reference=` |
| Personal ↔ Technical | `POST …/account/internal-transfer/personal-to-technical` · `…/technical-to-personal` · `…/{id}/verify-otp` · `…/{id}/resend-otp` |

სრული API ლოგიკა (v3 guide, error კოდები, რენდერის წესები, QA ჩეკლისტი) → [account-statement-api.md](account-statement-api.md).

ტოკენი: `npm run merchant:token` (სხვა იუზერი: `MERCHANT_MOBILE=… MERCHANT_MAILINATOR_INBOX=… npm run merchant:token`).

---

## შენიშვნა განახლებებზე

ეს დოკუმენტი აღწერს ფლოუებს PDF-ის მდგომარეობით (ატვირთვის თარიღი: 2026-09-11), სექცია 5 — რეალური ქცევით (2026-10-27). თუ ბიზნეს-ლოგიკაში რამე შეიცვლება (ახალი ოპერაციის ტიპი, OTP/SCA წესების ცვლილება, VoP შედეგების ცვლილება და ა.შ.) — **მითხარი კონკრეტულად რა შეიცვალა, და ეს ფაილი განვაახლებ.**
