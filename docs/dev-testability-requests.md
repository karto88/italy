# Dev Testability Requests — Wallet KYB (multi-person)

**პრობლემა:** როცა KYB-ში **დამატებით პიროვნებას (TE/Firmatario)** ვამატებთ ("Add"),
ამ member-ის ველების ნაწილს **სტაბილური `id`/`name` არ აქვს** (დინამიური MUI id-ები, მაგ. `_r_98_`)
და grid-nesting-ის გამო per-member scoping (name/heading-ით) არასაიმედოა.
შედეგად **ავტომატიზაცია ვერ წვდება** ამ ინფუთებს (fill/click timeout).

**მოთხოვნა:** დაემატოს **უნიკალური, სტაბილური `id`** (ან `data-testid`) ყველა member-ის ველს,
Persone-ს არსებული პატერნის მიხედვით: **`3.members.{index}.<field>`** (index 0 = ES, 1+ = TE).

---

## 1. Documenti step — per-member დოკუმენტის ველები ⛔ (ბლოკავს TC0.14+)

დამატებული member-ის ბარათში (მაგ. index 1) შემდეგ ველებს **id არ აქვს**:

| ველი | ამჟამად | სასურველი id |
|---|---|---|
| Tipo documento | დინამიური | `6.members.{i}.docType` |
| Carica (ID სურათი) | ღილაკი, id არ აქვს | `6.members.{i}.docFile` |
| Numero documento | დინამიური `_r_XX_` | `6.members.{i}.docNumber` |
| Data di rilascio | დინამიური | `6.members.{i}.issueDate` |
| Data scadenza | დინამიური | `6.members.{i}.expiryDate` |
| Ente rilascio | დინამიური | `6.members.{i}.issuingAuthority` |
| Luogo di rilascio | დინამიური | `6.members.{i}.issuePlace` |

> (section prefix — რაც პროექტში მიღებულია; მთავარია `members.{i}.` სქემა.)

## 2. Persone step — Data di nascita / Sesso

Persone-ს **დანარჩენი ველები კარგია** (`3.members.{i}.*`), მაგრამ ორ ველს დინამიური id აქვს:

| ველი | ამჟამად | სასურველი id |
|---|---|---|
| Data di nascita | `_r_51_` | `3.members.{i}.birthDate` |
| Sesso | `_r_54_` | `3.members.{i}.gender` |

## 3. PEP step — per-member

| ველი | ამჟამად | სასურველი |
|---|---|---|
| Status PEP (radios) | getByText nth(i) | `4.members.{i}.pepStatus` |
| Sono contribuente USA | label nth(i) | `4.members.{i}.usTaxpayer` |
| Carica documenti (W9) | ღილაკი | `4.members.{i}.usTaxpayerDoc` |

---

## რას აგვარებს

- ✅ საიმედო per-member ავტომატიზაცია (TC0.14 – TC0.16, multi-person ქეისები)
- ✅ აღარ დაგვჭირდება fragile `.nth()` / `label:hasText` / card-scoping
- ✅ ერთიანი პატერნი (`members.{i}.*`) მთელ wizard-ში

## სტატუსი

- **TC0.13** (1 პიროვნება) — ✅ სრულად ავტომატიზებული (Documenti single-person id-ებით მუშაობს).
- **TC0.14+** (multi-person) — ⛔ ბლოკირებულია Documenti-ს member-ველების id-ების უქონლობით.