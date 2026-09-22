# KeepzWalletService — Protocol v2.3.0 (ქართული თარგმანი/ანალიზი)

წყარო: `KeepzWalletService-Protocollo-v2.3.0 (2).html` (Desktop/test/it doc/). დოკუმენტი ორენოვანია (IT/EN, იდენტური შინაარსით) — ეს ქართული თარგმანი ეყრდნობა ორივეს. **ცვლილება წინა (v2.2.0) ვერსიიდან — იხ. ქვემოთ ⚠️ სექცია და §3.**

**რას ვთარგმნი, რას არა:** ლოგიკური/აღწერითი ტექსტი — ქართულად. ველების სახელები, ტიპები (`string`, `enum`...), endpoint-ების გზები, JSON, error კოდები — **უცვლელად, ინგლისურად** (ეს API contract-ის ნაწილია).

---

## ⚠️ რა შეიცვალა 2.2.0 → 2.3.0 (Breaking change)

**დაემატა ახალი lifecycle stage: `AWAITING_USER_AUTHORIZATION`**, `VERIFIED`-სა და `CONFIRMED`-ს შორის.

დოკუმენტური კონტექსტი (§7.4-ის "documents"-ის მიხედვით) და აპში ოპერაციის მიღების შემდეგ, მომხმარებელს **დამატებით** მოეთხოვება, SCA-თი (OTP SMS-ით) ავტორიზაცია გაუწიოს wallet-ზე თანხის ყოველ გადაადგილებას — ეს არის TPPay-ის მოთხოვნა. ერთი ოპერაციისთვის საჭირო SCA-ების რაოდენობა **1-დან 2-მდეა**, დამოკიდებული `operationType`-ზე (იხ. ახალი "SCA user" სვეტი §7.2-ში ქვემოთ).

**რატომ Breaking:** ვინც 2.2.0-ს იმპლემენტირებდა, `check-confirmation`-ის polling loop-ში ახალი შუალედური სტატუსი (`AWAITING_USER_AUTHORIZATION`) უნდა დაამატოს — წინააღმდეგ შემთხვევაში ვერ გაარჩევს "მომხმარებელმა ჯერ არ დაადასტურა" და "მომხმარებელმა დაადასტურა, ჯერ OTP-ს ელოდება" შემთხვევებს.

**რაც უცვლელია:** QR სკანირება და დოკუმენტის დაბრუნება (Retail-ის FASE 2) SCA-ს არ საჭიროებს — ეს ისევ 2.2.0-ის ლოგიკაა. `cancel-operation`-ის წესიც ლოგიკურად გაგრძელდა: გაუქმება ახლა დაშვებულია **`AWAITING_USER_AUTHORIZATION`-ის ჩათვლითაც** (არა მხოლოდ `VERIFIED`-მდე, როგორც 2.2.0-ში იყო ნაგულისხმევი) — რადგან OTP-ის მოლოდინში ფული ჯერ არ არის გადატანილი.

---

## 1. შესავალი და დანიშნულება

**KeepzWalletService** — ინტეგრაციის პროტოკოლი, რომელსაც Keepz სთავაზობს პარტნიორებს გადახდის ოპერაციების შესასრულებლად.

**მიზანი:** ერთი პროტოკოლი ბევრი ცალკეული ინტერფეისის ნაცვლად. კონკრეტულად:
- **5 ოპერაციის ტიპი** ერთი და იგივე call-სექვენციით: wallet top-up, wallet withdrawal, gaming account top-up, gaming account withdrawal, product purchase
- **2 არხი** — `RETAIL` და `ONLINE` — ერთი `channel` პარამეტრით გამორჩეული, რომელიც განსაზღვრავს რომელი context object ახლავს request-ს
- **Wallet არსებობის შემოწმება** — პარტნიორს შეუძლია იკითხოს, კონკრეტულ codice fiscale-ზე (საგადასახადო კოდი) არსებობს თუ არა wallet
- **KYC/KYB მონაცემების წინასწარ ჩატვირთვა** — 2 დამხმარე მეთოდი, რომლითაც პარტნიორი წინასწარ აწვდის მონაცემებს, რომ onboarding-ის დროს verification შემცირდეს

**Scope/ვისთვისაა:** მხოლოდ **პარტნიორებისთვის, ვისაც აქვთ საკუთარი ინტერფეისი საბოლოო მომხმარებლისთვის** (agency dashboard, საიტი, აპლიკაცია). **არ ეხება** შემთხვევებს, როცა merchant/user პირდაპირ Keepz-ის საკუთარ ხელსაწყოებზე მუშაობს (merchant portal, Keepz app) — იქ მესამე მხარის სისტემა არ არსებობს, პროტოკოლს აზრი არ აქვს.

**პასუხისმგებლობის საზღვარი:** პროტოკოლი მართავს **მხოლოდ** ფულს, რომელიც შედის/გადის Keepz wallet-ში. **Gaming account-ის ბალანსის განახლება პროტოკოლის ნაწილი არაა** — ეს პარტნიორის პასუხისმგებლობაა, საკუთარ სისტემაზე, მას შემდეგ, რაც `check-confirmation` (§7.5) დაანახვებს რომ ფული რეალურად გადავიდა. Keepz არც კითხულობს, არც ცვლის gaming account-ს. ⚠️ **შესაბამისად, ისეთი შემოწმებები, როგორიცაა თამაშისგან თვითგარიცხვა (self-exclusion), დეპოზიტის ლიმიტები, ბალანსი — რჩება პარტნიორის პასუხისმგებლობად**, Keepz ამის შესახებ არაფერს იცის და ვერ იტყვის უარს ოპერაციაზე ამ მიზეზებით.

---

## 3. ვერსიების ისტორია

| ვერსია | თარიღი | ცვლილება |
|---|---|---|
| **1.0** | — | პირველი დრაფტი. 4 ოპერაცია, მხოლოდ Retail. OAuth2 client-credentials + polling-ზე დაფუძნებული lifecycle |
| **2.0.0** | 30/07/2026 | პროტოკოლი დასახელდა **KeepzWalletService**-ად, პირველი "გაყინული" ვერსია. დაემატა: `channel` პარამეტრი, `PURCHASE_PRODUCT` ტიპი, wallet existence check, `prePopulateKyc`/`prePopulateKyb`. ყველა მეთოდი `POST`-ზე გადავიდა (აღარც `check-operation`/`check-confirmation` არის `GET`). `resultCode`/`resultMessage` ყველა პასუხზე. `requestId`/`clientId` სავალდებულო ყველგან + ახალი `CLIENT_MISMATCH` error |
| **2.1.0** | 21/08/2026 | დაზუსტდა რომელი ოპერაციის ტიპი რომელ არხზეა დაშვებული — gaming ოპერაციები (2) ორივე არხზეა, `TOPUP_WALLET`/`WITHDRAW_WALLET`/`PURCHASE_PRODUCT` **მხოლოდ Retail-ზე** (ფიზიკური სალაროსთან გაცვლას გულისხმობს) |
| **2.2.0** | 26/08/2026 | **⚠️ Breaking change:** წაშალა `AWAITING_USER_LOGIN` სტატუსი lifecycle-იდან. QR სკანირება უკვე თავისთავად "ოპერაციის აღების" აქტია — ცალკე login-ის მოლოდინი აღარ არსებობს. `GENERATED` → პირდაპირ `IDENTIFIED` (Retail) ან `VERIFIED` (Online) |
| **2.3.0** | 02/09/2026 | **⚠️ Breaking change:** დაემატა ახალი სტატუსი `AWAITING_USER_AUTHORIZATION`, `VERIFIED`-სა და `CONFIRMED`-ს შორის. დოკუმენტის შემოწმებისა და აპში ოპერაციის მიღების შემდეგ, მომხმარებელმა SCA-თი (OTP SMS-ით) უნდა დაადასტუროს wallet-ზე გადატანები — TPPay-ის მოთხოვნით. 1-დან 2-მდე ავტორიზაცია, `operationType`-ზე დამოკიდებული (ახალი სვეტი §7.2-ში). `check-confirmation`-ის (§7.5) polling ლოგიკა განახლდა; `cancel-operation` (§7.6) ახლა დაშვებულია ახალი სტატუსის ჩათვლითაც (OTP მოლოდინში ფული ჯერ არ გადასულა) |

**ვერსირების სქემა:** `major.minor.patch` — **major** = ცვლილება არღვევს თავსებადობას; **minor** = ემატება ახალი მეთოდი/ველი, არავის არ ავალდებულებს ცვლილებას; **patch** = მხოლოდ დოკუმენტაციის დაზუსტება.

---

## 4. ტერმინთა ლექსიკონი

| ტერმინი | განმარტება |
|---|---|
| **Operation** | ერთი ფულადი მოძრაობის ინსტანცია, `operationId`-ით იდენტიფიცირებული, `operationType`+`channel`-ით დახასიათებული |
| **Channel** | `RETAIL` — ოპერატორი მოქმედებს ფიზიკურად დამსწრე კლიენტისთვის; `ONLINE` — უკვე ავთენტიფიცირებული მომხმარებელი მოქმედებს დამოუკიდებლად |
| **Partner** | ვინც პროტოკოლს ინტეგრირებს (gaming concessionaire, POS აგრეგატორი, merchant) |
| **Gaming platform** | კონცესიონერის სისტემა, თამაშის ანგარიშების მართვისთვის. ოპერაციებში — `clientId`-ით განისაზღვრება; pre-loading-ში — `idGamePlatform`-ით |
| **Merchant** | ბიზნესი, ერთი ან მეტი shop-ის მფლობელი, `merchantId`-ით |
| **Shop** | ფიზიკური წერტილი Retail ოპერაციებისთვის, `idShop`-ით |
| **Operator** | POS თანამშრომელი, ვინც ოპერაციას იწყებს და კლიენტის იდენტობას ამოწმებს, `idOperator`-ით |
| **Keepz wallet** | საბოლოო მომხმარებლის ელექტრონული ფულის ანგარიში |
| **Gaming account** | მოთამაშის ანგარიში კონცესიონერთან — **განსხვავებული** Keepz wallet-ისგან, ბალანსს მართავს პარტნიორი |
| **SCA** | Strong Customer Authentication — პროტოკოლში ეს არის wallet-ზე თანხის გადატანების ავტორიზაცია, რომელსაც მომხმარებელი Keepz app-ში OTP-ით (SMS) იძლევა, TPPay-ის მოთხოვნით, აპში ოპერაციის მიღების შემდეგ. **არ არის** იგივე, რაც QR-ის სკანამდე უკვე მომხდარი in-app login (v2.2.0-ში ეს ტერმინი "in-app login"-ს გულისხმობდა — v2.3.0-ში დაზუსტდა) |
| **KYC / KYB** | Know Your Customer / Know Your Business |
| **Pre-loading** | verification-სთვის საჭირო მონაცემების წინასწარი გადაცემა, ოპერაციული flow-ს გარეთ |
| **Self-exclusion** | მოთამაშის თვითგარიცხვა თამაშისგან — პროტოკოლი ამის სტატუსს არ ატარებს, ეს პარტნიორის საზრუნავია |
| **Beneficial owner** | ფიზიკური პირი, ვინც ბოლოს ფლობს/აკონტროლებს ბიზნესს (KYB-ისთვის საჭირო) |
| **PEP** | Politically Exposed Person |

---

## 5. სექვენციის დიაგრამები

### 5.1 RETAIL

სექვენცია **იდენტურია ყველა 5 ოპერაციის ტიპისთვის** — იცვლება მხოლოდ `operationType` მნიშვნელობა და შესაბამისი conditional object.

**გაუქმება (`cancel-operation`, §7.6):** დაშვებულია **ნებისმიერ მომენტში, `AWAITING_USER_AUTHORIZATION`-ის ჩათვლით** (v2.3.0-ში გაფართოვდა — ადრე `VERIFIED`-ის ჩათვლით იყო) — `CONFIRMED`-იდან მოყოლებული კი აღარ შეიძლება (regolamento უკვე დაწყებულია, ოპერაცია მხოლოდ დასრულებას ექვემდებარება).

**4 ფაზა:**
1. **ოპერაციის დაწყება** — მომხმარებელი ეუბნება ოპერაციას+თანხას, აჩვენებს დოკუმენტს → პარტნიორი: `start-operation(channel=RETAIL, operationType, amount, externalRef, retailContext[, product])` → `200 {operationId}`
2. **მომხმარებლის იდენტიფიკაცია** — polling ყოველ 2-3წმ, სანამ `GENERATED`-ია; (optional: cancel თუ კლიენტი QR-ის სკანამდე თავს ანებებს); მომხმარებელი სკანირებს QR-ს → `stage = IDENTIFIED` + პირადობის მონაცემები + დოკუმენტი
3. **დოკუმენტის შემოწმება** — ოპერატორი ადარებს ეკრანზე ნაჩვენებ დოკუმენტს წარმოდგენილთან: თუ ემთხვევა → `verify-operation` → `VERIFIED`; თუ არა/კლიენტი თავს ანებებს → `cancel-operation` → `CANCELLED`
4. **მიღება, ავტორიზაცია და regolamento** 🆕 — მომხმარებელი ხედავს მონაცემებს და **იღებს** ოპერაციას აპში → polling `check-confirmation` → `VERIFIED`/`AWAITING_USER_AUTHORIZATION` → მომხმარებელი **ავტორიზაციას უწევს გადატანებს SCA-თი (1-2 OTP SMS-ით, `operationType`-ზე დამოკიდებული)** → polling გრძელდება → `CONFIRMED` → `COMPLETED`

### 5.2 ONLINE

Online-ზე მხოლოდ **2 gaming account ოპერაცია** მუშაობს (`TOPUP_GAMING_ACCOUNT`, `WITHDRAW_GAMING_ACCOUNT`) — იგივე მეთოდები, მაგრამ ოპერატორის, ნაღდი ფულის და დოკუმენტის გარეშე. დანარჩენი 3 ტიპი აქ არ ჩანს, რადგან სალაროსთან ფიზიკურ გაცვლას გულისხმობს, რაც Online-ზე არ არსებობს.

**როგორ გადადის მომხმარებელი Keepz app-ზე:** პარტნიორთან ავთენტიფიცირება საკმარისი არ არის — ოპერაცია **Keepz app-შივე** უნდა დადასტურდეს. გადასვლა ხდება `start-operation`-ის დაბრუნებული content-ით — QR (დესკტოპ ბრაუზერი) ან deep link (მობილური ბრაუზერი).

**რატომ არ არის identity verification (§7.4):** არც ოპერატორია, არც შესადარებელი დოკუმენტი — in-app login ასრულებს იმ როლს, რასაც Retail-ზე ერთად login+ოპერატორის შემოწმება ასრულებდა → ოპერაცია პირდაპირ `VERIFIED`-ზე გადადის, `IDENTIFIED`-ს გვერდის ავლით.

**4 ფაზა:**
1. **არჩევანი + წინასწარი შემოწმება** — მომხმარებელი ირჩევს deposit/withdraw + Keepz-ს როგორც გადახდის საშუალებას + თანხას (+ optional promocode) → პარტნიორი: `existence/wallet(fiscalCode)` → თუ wallet არსებობს, აგრძელებს; თუ არა → `onboardingUrl` (QR თუ მომხმარებელი წინაშეა, ან SMS/email)
2. **ოპერაციის დაწყება** — `start-operation(channel=ONLINE, ...)` → `200 {operationId, qrCodeUrl}`, `stage=GENERATED`
3. **გადასვლა Keepz app-ზე** — QR ან deep link; polling `GENERATED`-ის დროს → `VERIFIED`
4. **მიღება, ავტორიზაცია და regolamento** 🆕 — მომხმარებელი ხედავს/იღებს ოპერაციას აპში → polling `check-confirmation` → `VERIFIED`/`AWAITING_USER_AUTHORIZATION` → SCA ავტორიზაცია (Online-ზე gaming ოპერაციებს 1 OTP სჭირდება — იხ. §7.2 ცხრილი) → `CONFIRMED` → `COMPLETED`

### 5.3 Wallet-ის არსებობის შემოწმება

**სინქრონული** — `operationId` არაა, polling არაა, ერთი request, დაუყოვნებელი პასუხი. მიმართულება ყოველთვის **მხოლოდ პარტნიორი → Keepz** (პარტნიორს არაფრის expose არ სჭირდება).

### 5.4 KYC/KYB Pre-loading 🆕

ხდება **ოპერაციული flow-ს გარეთ**: პარტნიორი წინასწარ აწვდის თავისი მოთამაშეების/ვაჭრების მონაცემებს. Onboarding-ის დროს ეს მონაცემები უკვე არსებობს → verification მოკლდება.

**⚠️ მთავარი წესი (link key):** `prePopulateKyb`-ში მოწოდებული `idShop` არის **ის ზუსტად იგივე მნიშვნელობა**, რასაც პარტნიორი მოგვიანებით `retailContext`-ში გამოიყენებს ოპერაციის დაწყებისას. ანალოგიურად `prePopulateKyc`-ის `gameAccountId`. ამ დამთხვევის გარეშე წინასწარ ჩატვირთული მონაცემები გამოუსადეგარია.

---

## 6. უსაფრთხოება და ავთენტიფიკაცია

- **OAuth 2.0, client-credentials flow მხოლოდ.** პარტნიორი იღებს `client_id`/`client_secret`-ს აქტივაციისას → იღებს short-lived access token-ს (§7.1)-დან
- Token ყოველ request-ში: `Authorization: Bearer <access_token>`
- Credentials **მხოლოდ JSON body-ში** (არა `Authorization: Basic` header)
- Token-ს არ აქვს refresh token — ახალი token ავთენტიფიკაციის გამეორებით მიიღება
- **მხოლოდ HTTPS TLS 1.2+** — დაუშიფრავი არხის call-ები უარყოფილია
- **ორი ცალკე ავთენტიფიკაციის დონე** (ორივე სავალდებულო):
  - **პარტნიორი** — საკუთარი app credentials-ით
  - **საბოლოო მომხმარებელი** — 🆕 ორი ცალკე მოქმედება Keepz app-ში: (ა) **login/QR-სკანი** — უკვე მომხდარია QR-ის სკანირებამდე/deep link-ის გახსნამდე, ამოწმებს ოპერაციას (Retail-ზე დოკუმენტსაც ხელმისაწვდომს ხდის ოპერატორისთვის); (ბ) **SCA ავტორიზაცია** — დოკუმენტის შემოწმებისა და აპში მიღების შემდეგ, მომხმარებელი OTP-ით (SMS) ავტორიზაციას უწევს wallet-ზე გადატანებს — ეს არის `AWAITING_USER_AUTHORIZATION`-ის მოლოდინი, დასრულება გადაჰყავს `CONFIRMED`-ზე. ავტორიზაციების რაოდენობა (1-2) `operationType`-ზეა დამოკიდებული (§7.2)
  - ⚠️ **პარტნიორს არასდროს შეუძლია მომხმარებლის ნაცვლად დაადასტუროს ოპერაცია** — `VERIFIED`→`AWAITING_USER_AUTHORIZATION`→`CONFIRMED` გადასვლა **მხოლოდ** მომხმარებლის მოქმედებით განისაზღვრება (აპში მიღება + OTP-ები)
- **პერსონალური მონაცემების დაცვა:**
  - საიდენტიფიკაციო დოკუმენტი — მხოლოდ ვიზუალური შედარებისთვის, მხოლოდ ოპერაციის მიმდინარეობისას. **პარტნიორმა არ უნდა შეინახოს**
  - Existence check (§7.7) — **მხოლოდ** არსებობა+სტატუსი, არასდროს პირადი მონაცემები. **ძებნის/სიის მეთოდი არ არსებობს** — პროტოკოლი ბაზის "დათვალიერების" საშუალებას არ იძლევა
  - Pre-loaded data — გამოსადეგარია **მხოლოდ** KYC/KYB-სთვის, არცერთი მეთოდი მას არ აბრუნებს

**Tracciabilità (Traceability) 🆕:** ყოველი ოპერაცია ინახავს `idShop`/`idOperator`-ს, ADM კოდს (თუ დეკლარირებულია), identity verification-ის შედეგს და ყოველი state-ცვლილების დროს. `externalRef` — reconciliation პარტნიორის სისტემასთან; `requestId` — ყოველი ცალკეული call-ის შედეგთან დაკავშირება.

---

## 7. პროტოკოლი — Request/Response

**ზოგადი წესები:** ყველა მეთოდი `/payment-service/api/v2` პრეფიქსით, ყველა **POST** (URL-ში პარამეტრი არასდროს — განზრახ გადაწყვეტილება: თავიდან იცილებს ამბიგუიტეტს და, რაც მთავარია, **პირადი მონაცემები (codice fiscale) არასდროს ხვდება URL-ში**, სადაც server/proxy/balancer log-ებში ჩაიწერებოდა). JSON, UTF-8. ყოველი წარმატებული პასუხის პირველი 2 ველი: `resultCode`+`resultMessage`.

**საერთო ველები ყველა request/response-ში:**
- **`requestId`** — ერთი კონკრეტული HTTP call-ის იდენტიფიკატორი, პარტნიორი აგენერირებს, უცვლელად ბრუნდება. **არ განსაზღვრავს იდემპოტენტობას** — network error-ის შემდეგ retry-ს **ახალი** `requestId` აქვს
- **`clientId`** — დამრეკავი პარტნიორის იდენტიფიკატორი (იგივე რაც token-ის მისაღებად გამოყენებული `client_id`). **არ არის authorization მონაცემი** — Keepz ყოველთვის token-იდან იღებს caller-ის იდენტობას, body-ს ველს მხოლოდ შედარებისთვის იყენებს. შეუსაბამობა → `CLIENT_MISMATCH`
- **`clientId` ასევე განსაზღვრავს gaming platform-ს** — Keepz ცალკე client-ს ანიჭებს თითო პლატფორმას, ამიტომ `idGamePlatform` არ ჩანს `start-operation`-ის ველებში
- **იდემპოტენტობა ცალკე საკითხია**, მხოლოდ state-ცვლადი მეთოდებისთვის: `start-operation`(§7.2) → key=`externalRef`; `verify-operation`(§7.4)/`cancel-operation`(§7.6) → key=`operationId`; pre-loading მეთოდები(§7.8/7.9) → key=fiscal code/merchant/shop id

### 7.1 Authentication — `POST /operations/external/auth`
**დანიშნულება:** access token-ის მიღება. პირველი ნაბიჯი, §5-ის დიაგრამებში არ ჩანს (მთელ ოპერაციულ flow-ს წინ უსწრებს).

| Request | Type | Req. |
|---|---|---|
| requestId | string | Yes |
| grant_type | string | Yes (ფიქსირებული `client_credentials`) |
| client_id | string | Yes |
| client_secret | string | Yes |

**Response 200:** `resultCode`, `resultMessage`, `requestId`, `clientId`, `access_token` (JWT), `token_type` (`Bearer`), `expires_in` (წამები)

### 7.2 Start operation — `POST /operations/external/start-operation`
**დანიშნულება:** ოპერაციის შექმნა + `operationId`-ის მიღება. §5.1/§5.2-ის პირველი ნაბიჯი.

| Request | Type | Req. | შენიშვნა |
|---|---|---|---|
| channel | enum | Yes | `RETAIL`/`ONLINE` |
| operationType | enum | Yes | იხ. ცხრილი ქვემოთ |
| amount | decimal | Yes | **ყოველთვის authoritative**, `PURCHASE_PRODUCT`-ზეც კი — Keepz-მა არ იცის პარტნიორის კატალოგი. მინ. 2.00, 2 ათწილადი |
| currency | string | No | default `EUR` (ISO 4217) |
| externalRef | string | Yes | **იდემპოტენტობის key** |
| promoCode | string | No | მხოლოდ tracking-ისთვის, ჩვეულებრივ Online-ზე |
| retailContext | object | Cond. | თუ `channel=RETAIL` |
| onlineContext | object | Cond. | თუ `channel=ONLINE` |
| product | object | Cond. | თუ `operationType=PURCHASE_PRODUCT` |

**Response 200:** `operationId`, `stage` (თავიდან ყოველთვის `GENERATED`), `qrCodeUrl`, `expiresAt`

**იდემპოტენტობა:** იგივე `externalRef`+იგივე data → იგივე `operationId` ბრუნდება (ახალი ოპერაცია არ იქმნება). თუ data განსხვავდება → `EXTERNAL_REF_CONFLICT`.

**`operationType` — 5 ტიპი (🆕 SCA სვეტი დაემატა v2.3.0-ში):**

| ტიპი | ფულადი მოძრაობა | არხი | SCA user 🆕 |
|---|---|---|---|
| `TOPUP_WALLET` | credit user wallet-ზე (მომხმარებელი აძლევს ნაღდს) | Retail | 1 |
| `WITHDRAW_WALLET` | debit user wallet-იდან (merchant აძლევს ნაღდს) | Retail | 1 |
| `TOPUP_GAMING_ACCOUNT` | debit user wallet-იდან → gaming platform-ისკენ. Gaming account-ზე credit **პარტნიორი აკეთებს საკუთარ სისტემაზე** | Retail + Online | **2 Retail-ზე, 1 Online-ზე** |
| `WITHDRAW_GAMING_ACCOUNT` | credit user wallet-ზე, gaming platform-იდან. Gaming account-ის debit **პარტნიორის** მხარეზეა | Retail + Online | 1 |
| `PURCHASE_PRODUCT` | debit user wallet-იდან → merchant-ისკენ | Retail | 1 |

**SCA user სვეტის მნიშვნელობა:** რამდენჯერ სჭირდება მომხმარებელს SCA-ს გავლა (OTP SMS-ით) ოპერაციის განმავლობაში, დოკუმენტის შემოწმებისა და აპში მიღების შემდეგ — თითო SCA თითო wallet-ის მოძრაობაზე. `TOPUP_GAMING_ACCOUNT` Retail-ზე 2-ს საჭიროებს, რადგან ნაღდიდან wallet-ზე კრედიტი შემდეგ gaming platform-ზე გადადის; Online-ზე ფული უკვე wallet-შია და ერთიც კმარა. ავტორიზაციები თანმიმდევრულად სრულდება ერთადერთ `AWAITING_USER_AUTHORIZATION` მოლოდინში (§7.10) — პარტნიორი სტატუსს ერთხელ ხედავს, მაგრამ ოპერატორმა უნდა იცოდეს კლიენტს რამდენი OTP მოუვა.

⚠️ **მთავარი წესი:** ორივე gaming ოპერაციაზე, **პარტნიორს Keepz არ სჭირდება gaming account-ის მოძრაობისთვის** — მხოლოდ wallet-ის მხარეს (leg) ითხოვს Keepz-ისგან. `TOPUP_WALLET`/`WITHDRAW_WALLET`/`PURCHASE_PRODUCT` მხოლოდ Retail-ზეა, რადგან სალაროსთან ფიზიკურ გაცვლას (ნაღდი/პროდუქტი) გულისხმობს. არასწორი ტიპი არხისთვის → `INVALID_CHANNEL_CONTEXT`.

**`retailContext`:** `idShop`(Yes, უნდა ემთხვეოდეს `prePopulateKyb`-ით უკვე გაგზავნილს), `admRegistrationCode`(No, მხოლოდ tracking), `idOperator`(Yes), `idTerminal`(No)

**`onlineContext`:** `fiscalCode`(Yes — key რომლითაც Keepz პოულობს wallet-ს), `sessionRef`(No)

**`product`** (მხოლოდ `PURCHASE_PRODUCT`-ზე): `sku`(Yes), `label`(Yes, მომხმარებელს უჩვენება confirmation-ზე), `merchantId`(Yes) — **მხოლოდ tracking/display-ისთვის, თანხაზე გავლენას არ ახდენს**

### 7.3 Operation status — `POST /operations/external/check-operation`
**დანიშნულება:** იდენტიფიკაციის ფაზის მიმდევრობა. Retail-ზე polling QR-ის სკანამდე; `IDENTIFIED`-ზე პასუხი შეიცავს პირად მონაცემებს+დოკუმენტს ოპერატორისთვის. Online-ზე პირდაპირ `GENERATED`→`VERIFIED`, `IDENTIFIED` არ არსებობს.

**Response:** `stage`, `amount`, `name`/`dateOfBirth`/`gender`/`fiscalCode`/`documents` (ყველა — **მხოლოდ** `IDENTIFIED`-იდან მოყოლებული)

**Polling ლოგიკა:** გააგრძელე სანამ `GENERATED`-ია; გაჩერდი `IDENTIFIED`-ზე. რეკომენდებული ინტერვალი: 2-3წმ.

### 7.4 Identity verification — `POST /operations/external/verify-operation`
**დანიშნულება:** ჩაწერს, რომ ოპერატორმა ეკრანზე ნაჩვენები დოკუმენტი შეადარა წარმოდგენილს და დაადასტურა დამთხვევა → `VERIFIED`. **Online არხზე არ გამოიყენება.**

**Request:** `operationId`(Yes), `idOperator`(No)
**Response:** `stage` = `VERIFIED`

იდემპოტენტური კონსტრუქციით — თუ უკვე `VERIFIED`-ია, მეორე call იმავე state-ს აბრუნებს (არა error-ს). `INVALID_STAGE_TRANSITION` მხოლოდ იმ შემთხვევაშია, როცა საწყისი state საერთოდ არ იძლევა verify-ის საშუალებას.

### 7.5 Confirmation status — `POST /operations/external/check-confirmation`
**დანიშნულება:** დაადევნოს თვალი მომხმარებლის მიღებიდან, SCA ავტორიზაციის გავლით, საბოლოო შედეგამდე. 🆕 სანამ სტატუსი `AWAITING_USER_AUTHORIZATION`-ია, ოპერაცია ჩერდება მომხმარებლის მიერ SMS-ით მიღებული OTP-ის შეყვანის მოლოდინში — ოპერატორმა ეს იცის და შეუძლია კლიენტს უთხრას. **ეს არის ერთადერთი წერტილი, სადაც პარტნიორი გებულობს, ოპერაცია წარმატებული იყო თუ არა.**

**Response:** `operationStage`, `transactionId`(`COMPLETED`-იდან), `externalRef`, `completedAt`(`COMPLETED`-იდან), `errorCode`/`errorMessage`(თუ `FAILED`)

**Polling ლოგიკა 🆕:** გააგრძელე სანამ `VERIFIED`, `AWAITING_USER_AUTHORIZATION` ან `CONFIRMED`-ია; გაჩერდი `COMPLETED`/`FAILED`/`CANCELLED`-ზე. ინტერვალი: 2-3წმ.

### 7.6 Cancel operation — `POST /operations/external/cancel-operation`
**დანიშნულება:** ოპერაციის შეწყვეტა regolamento-მდე — კლიენტის მოთხოვნით, ოპერატორის უარით ან ლოდინის ვადის ამოწურვით. დაშვებული 🆕 **`AWAITING_USER_AUTHORIZATION`-ის ჩათვლით** (გაფართოვდა v2.3.0-ში — ადრე `VERIFIED`-ის ჩათვლით იყო), **არა** `CONFIRMED`-იდან მოყოლებული — OTP-ის მოლოდინში ფული ჯერ არ არის გადატანილი.

**Request:** `operationId`(Yes), `reason`(No)
**Response:** `stage` = `CANCELLED` (ესეც იდემპოტენტურია)

### 7.7 Wallet existence check — `POST /existence/wallet`
**დანიშნულება:** ნებისმიერი ოპერაციის დაწყებამდე გაარკვიოს, აქვს თუ არა კონკრეტულ codice fiscale-ს Keepz wallet. **რეკომენდირებულია სისტემატურად, ყოველი ოპერაციის წინ** — თავიდან იცილებს "wallet-ის გარეშე" შემთხვევას.

Თუ wallet არ არსებობს → response შეიცავს **onboarding link-ს** — QR-ად ან SMS/email-ით გადასაცემი.

**Response:** `exists`(boolean), `walletId`+`status`(`ACTIVE`/`SUSPENDED`/`PENDING_KYC`/`CLOSED`)+`operational`(თუ `exists=true` — wallet შეიძლება არსებობდეს, მაგრამ არ იყოს ოპერაციული), `onboardingUrl`(თუ `exists=false`)

⚠️ **Privacy:** მხოლოდ existence+status, **არასდროს** პირადი მონაცემები. **ძებნის/სიის მეთოდი არ არსებობს.**

### 7.8 KYC data pre-loading 🆕 — `POST /prePopulateKyc`
**დანიშნულება:** მოთამაშეების პირადი მონაცემების წინასწარი გადაცემა. **1-50 subject** ერთ call-ში.

**`individuals` element-ის ველები:** `fiscalCode`, `name`, `surname`, `gender`, `birth`(§7.10), `citizenship`(`code`+`name`), `addresses`(მინ. residence), `documents`(მინ. 1 ვალიდური), `email`, `mobilePrefix`+`mobile`, `identifiedAt`, `gameAccount`(optional — `idGamePlatform`+`gameAccountId`+`status`)

**Response:** `batchId`, `received`/`accepted`/`rejected`, `results[]` (outcome: `ACCEPTED`/`UPDATED`/`REJECTED`)

იდემპოტენტური `fiscalCode`-ზე. **მაქს. 50** სუბიექტი/call → ამის ზემოთ `BATCH_SIZE_EXCEEDED`.

### 7.9 KYB data pre-loading 🆕 — `POST /prePopulateKyb`
**დანიშნულება:** merchant-ების + shop-ების მონაცემების წინასწარი გადაცემა. **ორდონიანი სტრუქტურა** — 1 merchant თავისი shop(ებ)ით.

**`merchants` element-ის ველები:** `merchantId`(idempotency key), `businessName`, `legalForm`, `vatNumber`, `fiscalCode`(No), `sae`/`ateco`(No), `reaNumber`/`reaProvince`/`reaDate`(No), `pec`(No), `email`(Yes), `phonePrefix`/`phone`(No), `legalAddress`(type=`LEGAL`), `members[]`(legal rep/signer/beneficial owner + PEP ველები), `shops[]`

**`shops` element:** `idShop` (⚠️ **იგივე, რასაც მოგვიანებით `retailContext`-ში გამოვიყენებთ**), `name`, `admRegistrationCode`(Cond. — თუ gaming-ისთვის ჩართული), `address`(type=`OPERATIONAL`), `operatingSchedule`(No), `contactEmail`/`contactPhone`(No), `gamePlatformIds`(No), `status`(`ACTIVE`/`SUSPENDED`/`CLOSED`)

**`members` element:** `fiscalCode`, `name`, `surname`, `gender`, `birth`, `email`(No), `mobilePrefix`+`mobile`(No), `legalRepresentative`(bool), `signer`(bool), `beneficialOwner`(bool), `amlPep`(bool), `amlPepType`+`amlPepRelationship`(Cond. თუ `amlPep=true`)

იდემპოტენტური `merchantId`(merchant)+`idShop`(shop)-ზე. **მაქს. 50** merchant/call. Merchant შეიძლება მიღებულ იქნას, თუნდაც ერთ-ერთი მისი shop უარყოფილი იყოს — merchant-ის outcome მაინც `ACCEPTED`/`UPDATED` იქნება, shop-ის დეტალი `shopResults`-ში.

### 7.10 Complex Types

**`stage` — ოპერაციის სტატუსები (🆕 დაემატა `AWAITING_USER_AUTHORIZATION`):**

| სტატუსი | არხი | მნიშვნელობა |
|---|---|---|
| `GENERATED` | ორივე | ოპერაცია შექმნილია, მოლოდინშია Keepz app-ში გახსნის (QR/deep link) |
| `IDENTIFIED` | Retail | Login დასრულებულია, პირადი მონაცემები+დოკუმენტი ხელმისაწვდომია ოპერატორისთვის. Online-ზე ეს სტატუსი არ არსებობს |
| `VERIFIED` | ორივე | იდენტობა დადასტურებულია, მოლოდინშია მომხმარებლის მიერ ოპერაციის აპში მიღების |
| 🆕 `AWAITING_USER_AUTHORIZATION` | ორივე | მომხმარებელმა მიიღო ოპერაცია აპში. მოლოდინშია SCA ავტორიზაციის (1-2 OTP SMS-ით, §7.2). **გაუქმება ჯერ კიდევ დაშვებულია** |
| `CONFIRMED` | ორივე | მომხმარებელმა SCA-თი ავტორიზაცია გაუწია გადატანებს. Regolamento მიმდინარეობს. **აქედან გაუქმება აღარ შეიძლება** |
| `COMPLETED` | ორივე | წარმატებით დასრულებული. საბოლოო სტატუსი |
| `FAILED` | ორივე | წარუმატებელი. საბოლოო სტატუსი |
| `CANCELLED` | ორივე | გაუქმებული regolamento-მდე. საბოლოო სტატუსი |

**`address`** (`prePopulateKyc`/`Kyb`-ში): `type`(`RESIDENCE`/`DOMICILE`/`LEGAL`/`OPERATIONAL`), `street`, `number`, `zipCode`, `cityName`, `cityCode`(No), `provName`(No), `provCode`(Yes), `countryName`(No), `countryCode`(ISO 3166-1 alpha-3, Yes)

**`birth`**: `date`(YYYY-MM-DD), `cityName`, `cityCode`(No), `provName`(No), `provCode`(Cond. — თუ დაბადების ქვეყანა იტალიაა), `countryName`(No), `countryCode`(Yes)

**`document`**: `type`(`IDENTITY_CARD`/`PASSPORT`/`DRIVING_LICENSE`), `number`, `releaseInstitution`(No), `releaseCity`(No), `releaseDate`(No), `expiryDate`(Yes — ვადაგასული დოკუმენტი შემოკლებულ verification-ს არ იძლევა)

### 7.11 Error codes

ყველა error-ის სტრუქტურა: `{ message, statusCode, exceptionGroup, requestId, clientId }`

⚠️ **დოკუმენტშივე მითითებული ღია საკითხი (v2.3.0-შიც კვლავ ღიაა):** success-პასუხები იყენებენ `resultCode`/`resultMessage`-ს, error-ები კი ჯერ კიდევ ძველ `message`/`statusCode` ფორმატს (v1-დან) — **ეს ორი ფორმა უნდა გაერთიანდეს**, გადაწყვეტილება release candidate-მდეა მისაღები. ასევე ოპერაციული errors-ების numeric კოდები (`exceptionGroup` მნიშვნელობები) **ჯერ კიდევ არ არის მინიჭებული** — დოკუმენტში symbolic (სახელით) ფორმაა, რომ არ შემოვიდეს შეუთანხმებელი მნიშვნელობები.

**Authentication errors:** `2475`(grant_type ცარიელი), `2476`(მხარდაუჭერელი grant type), `2478`(client_id/secret აკლია), `2479`(credentials უარყოფილი), `403 CLIENT_MISMATCH`

**Operational errors (symbolic, HTTP კოდით):**

| HTTP | კოდი | პირობა |
|---|---|---|
| 400 | `INVALID_CHANNEL_CONTEXT` | context object ან operationType არ არის დაშვებული დეკლარირებული channel-ისთვის |
| 400 | `MISSING_CONDITIONAL_FIELD` | conditional object აკლია (მაგ. `product` PURCHASE_PRODUCT-ზე) |
| 400 | `AMOUNT_BELOW_MINIMUM` | თანხა დაშვებულ მინიმუმზე დაბალია |
| 404 | `OPERATION_NOT_FOUND` | `operationId` არ არსებობს ან ვადაგასულია |
| 404 | `SHOP_NOT_REGISTERED` | `idShop` არ არის `prePopulateKyb`-ით გაგზავნილ shop-ებში |
| 409 | `INVALID_STAGE_TRANSITION` | მოთხოვნილი ოპერაცია არ არის დაშვებული მიმდინარე state-იდან (მაგ. cancel `CONFIRMED`-ის შემდეგ) |
| 409 | `EXTERNAL_REF_CONFLICT` | `externalRef` უკვე გამოყენებულია სხვა data-ით ოპერაციაზე |
| 422 | `WALLET_NOT_OPERATIONAL` | wallet არსებობს, მაგრამ არ არის ოპერაციული |
| 422 | `INSUFFICIENT_FUNDS` | არასაკმარისი თანხა |
| 413 | `BATCH_SIZE_EXCEEDED` | 50-ზე მეტი ჩანაწერი pre-loading call-ზე |
| 422 | `EXPIRED_DOCUMENT` | KYC pre-loading-ში ვადაგასული საიდენტიფიკაციო დოკუმენტი |

---

## შენიშვნა განახლებებზე

დოკუმენტი ასახავს v2.3.0-ს (02/09/2026) მდგომარეობით. თუ ვერსია შეიცვლება (ახალი mineure/major) — მითხარი კონკრეტულად რა შეიცვალა, და განვაახლებ.
