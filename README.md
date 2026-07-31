# ITALY პროექტი — KYB / KYC Playwright ავტომატიზაცია

## მიმოხილვა

იტალიის პროექტი, რომელიც ფოკუსირებულია **KYB (Know Your Business)** და **KYC (Know Your Customer)** flow-ების ავტომატიზებულ ტესტირებაზე Playwright-ით.

- დაწყების თარიღი: 2026-07-30

---

## URL-ები

| დანიშნულება | URL |
|-------------|-----|
| რეგისტრაცია / ლოგინის პორტალი | https://dev.portal.keepz.it/login |

---

## Setup

```bash
cd ITALY
npm install
npx playwright install chromium

# .env შექმენი .env.example-დან და შეავსე
cp .env.example .env
```

---

## გაშვება

```bash
npm run test          # ყველა ტესტი (headless)
npm run test:headed   # ხილული ბრაუზერით
npm run test:smoke    # მხოლოდ smoke (პორტალის availability)
npm run test:kyc      # KYC ტესტები
npm run test:kyb      # KYB ტესტები
npm run report        # HTML რეპორტი
npm run codegen       # selector-ების ჩაწერა login გვერდზე
```

---

## სტრუქტურა

```
ITALY/
├── config/
│   └── portal.config.ts       # URL-ები, route-ები, სატესტო მონაცემები
├── pages/                     # Page Objects
│   ├── BasePage.ts
│   ├── LoginPage.ts           # ლოგინი / რეგისტრაცია
│   ├── KycPage.ts             # KYC (ფიზიკური პირი)
│   └── KybPage.ts             # KYB (იურიდიული პირი)
├── tests/
│   ├── smoke.spec.ts          # პორტალის availability
│   ├── KYC/                   # KYC ტესტები
│   └── KYB/                   # KYB ტესტები
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

---

## ⚠️ მნიშვნელოვანი

Page Object-ებში selector-ები **placeholder-ია** (`⚠️ TODO` კომენტარებით).
რეალურ პორტალზე გავლის შემდეგ დაზუსტდეს:

```bash
npm run codegen   # ბრაუზერი გაიხსნება, აქციები ჩაიწერება კოდად
```

KYC/KYB spec-ები `test.skip`-ითაა მონიშნული — flow-ს დაზუსტების შემდეგ მოეხსნას `.skip`.

---

## წესები (CLAUDE.md-დან)

- ✅ dynamic მონაცემები **მხოლოდ** `.env`-იდან — არასდროს hardcode (tokens, IDs, credentials)
- ✅ Page Objects pattern
- ✅ მინიმალური `console.log` — მხოლოდ საბოლოო შედეგები
- ❌ NO step-by-step progress logs
