/**
 * random სატესტო მონაცემები (იტალიური სახელები/გვარები).
 */
const FIRST_NAMES = [
  'Luca', 'Marco', 'Giulia', 'Sofia', 'Matteo', 'Francesco', 'Chiara',
  'Alessandro', 'Martina', 'Lorenzo', 'Elena', 'Davide', 'Sara', 'Andrea',
  'Valentina', 'Simone', 'Federica', 'Giorgio', 'Beatrice', 'Riccardo',
];

const LAST_NAMES = [
  'Rossi', 'Bianchi', 'Ferrari', 'Russo', 'Esposito', 'Romano', 'Colombo',
  'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca',
  'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti',
];

const COMPANY_WORDS = [
  'Alfa', 'Meridiana', 'Nord Est', 'Vesuvio', 'Adriatica', 'Tirreno',
  'Lombarda', 'Toscana', 'Etna', 'Dolomiti', 'Appennino', 'Riviera',
  'Aurora', 'Fenice', 'Orion', 'Stella', 'Vela', 'Ponte',
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * უნიკალური კომპანიის სახელი — random იტალიური სიტყვა + timestamp suffix + SRL.
 * მაგ. "Vesuvio 483920 SRL" — ყოველ გაშვებაზე განსხვავებული (Yousign/PDF-ებში
 * ერთი და იგივე სახელი რომ არ დუბლირდეს სხვადასხვა ტესტ-კომპანიაზე).
 */
export function uniqueCompanyName(): string {
  return `${pick(COMPANY_WORDS)} ${String(Date.now()).slice(-6)} SRL`;
}

/** random სახელი/გვარი */
export function randomName(): { firstName: string; lastName: string } {
  return { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) };
}

/**
 * უნიკალური იმეილი — plus-addressing + incrementing counter.
 * მაგ. uniqueEmail('d.kartozia','keepz.me') → d.kartozia+1@keepz.me, +2, +3...
 * ყველა base inbox-ში ჩავარდება (d.kartozia@keepz.me), ასე OTP წაკითხვადია.
 * counter ინახება .email-counter ფაილში.
 */
/**
 * ტელეფონის ნომრების pool — incrementing counter (.phone-counter ფაილში).
 * DB-ში whitelisted ნომრები (OTP 111111). იუზერს აღარ ვშლით — ყოველ run-ზე ახალი ნომერი.
 * დიაპაზონი env-ით იცვლება: PHONE_START / PHONE_END.
 */
export function nextPhone(
  start = parseInt(process.env.PHONE_START || '34004015', 10),
  end = parseInt(process.env.PHONE_END || '34004518', 10)
): string {
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(__dirname, '..', '.phone-counter');
  let n = start;
  try {
    n = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) + 1;
  } catch {
    n = start;
  }
  if (!Number.isFinite(n) || n < start) n = start;
  if (n > end) {
    throw new Error(`Phone pool exhausted (>${end}). DB-ში ახალი ნომრები დაამატე და .phone-counter განაახლე.`);
  }
  fs.writeFileSync(counterFile, String(n));
  return String(n);
}

/**
 * უნიკალური 11-ციფრიანი company tax code (Partita IVA ფორმატი).
 * timestamp-ზე დაფუძნებული — ყოველ გაშვებაზე ახალი (ბაზაში collision-ს ავცდეთ).
 */
export function uniqueTaxCode(): string {
  return '3' + String(Date.now()).slice(-10); // 11 ციფრი
}

/**
 * უნიკალური registration number (Numero di registrazione).
 * ვალიდაცია: ასოები + ციფრები, 3-7 ციფრი (მაგ. MI1234567). MI + 6 უნიკალური ციფრი.
 */
export function uniqueRegNumber(): string {
  return 'MI' + String(Date.now()).slice(-6);
}

export function uniqueEmail(local = 'd.kartozia', domain = 'keepz.me'): string {
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(__dirname, '..', '.email-counter');
  let n = 1;
  try {
    n = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) + 1;
  } catch {
    n = 1;
  }
  if (!Number.isFinite(n) || n < 1) n = 1;
  fs.writeFileSync(counterFile, String(n));
  return `${local}+${n}@${domain}`;
}

/**
 * უნიკალური mailinator.com მეილი (მაგ. keepztest3@mailinator.com) — ყოველ run-ზე ახალი inbox,
 * იგივე ლოგიკით რაც uniqueEmail-ს (persistent counter ფაილი) — ძველი inbox-ის ხელახლა
 * გამოყენებას (stale OTP / already-registered account) ვცილდებით.
 */
export function uniqueMailinatorEmail(prefix = 'keepztest'): string {
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(__dirname, '..', '.mailinator-counter');
  let n = 1;
  try {
    n = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) + 1;
  } catch {
    n = 1;
  }
  if (!Number.isFinite(n) || n < 1) n = 1;
  fs.writeFileSync(counterFile, String(n));
  return `${prefix}${n}@mailinator.com`;
}
/**
 * ვალიდური იტალიური Codice Fiscale (16 სიმბოლო, საკონტროლო ასოთი).
 * დაბადების ქალაქი — Roma (H501). ყოველ გაშვებაზე random თარიღი → ახალი კოდი.
 */
export function fiscalCode(
  firstName: string,
  lastName: string,
  birthDate: string, // YYYY-MM-DD
  gender: 'M' | 'F' = 'M',
  cityCode = 'H501'
): string {
  const letters = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');
  const consonants = (s: string) => letters(s).replace(/[AEIOU]/g, '');
  const vowels = (s: string) => letters(s).replace(/[^AEIOU]/g, '');
  const pad = (s: string) => (s + 'XXX').slice(0, 3);

  const surnamePart = pad(consonants(lastName) + vowels(lastName));
  const c = consonants(firstName);
  const namePart = c.length >= 4 ? c[0] + c[2] + c[3] : pad(c + vowels(firstName));

  const [y, m, d] = birthDate.split('-').map(Number);
  const day = gender === 'F' ? d + 40 : d;
  const code = `${surnamePart}${namePart}${String(y).slice(-2)}${'ABCDEHLMPRST'[m - 1]}${String(day).padStart(2, '0')}${cityCode}`;

  const odd: Record<string, number> = {
    0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
    A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
    N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
  };
  const even = (ch: string) => (/\d/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65);
  const sum = [...code].reduce((acc, ch, i) => acc + (i % 2 === 0 ? odd[ch] : even(ch)), 0);
  return code + String.fromCharCode(65 + (sum % 26));
}

/** random დაბადების თარიღი (YYYY-MM-DD), 1970–1999 */
export function randomBirthDate(): string {
  const y = 1970 + Math.floor(Math.random() * 30);
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * pre-load-ის (KI-456) ტელეფონის pool — ნამდვილი იტალიური ფორმატი, 10 ციფრი (3XXXXXXXXX).
 * DB-ში whitelisted ნომრები (OTP 111111), ცალკე counter (.preload-phone-counter) — ძველ 8-ციფრიან pool-ს არ ერევა.
 * დიაპაზონი env-ით: PRELOAD_PHONE_START / PRELOAD_PHONE_END.
 */
export function nextPreloadPhone(
  start = parseInt(process.env.PRELOAD_PHONE_START || '3400451900', 10),
  end = parseInt(process.env.PRELOAD_PHONE_END || '3400452399', 10)
): string {
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(__dirname, '..', '.preload-phone-counter');
  let n = start;
  try {
    n = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) + 1;
  } catch {
    n = start;
  }
  if (!Number.isFinite(n) || n < start) n = start;
  if (n > end) {
    throw new Error(`Preload phone pool exhausted (>${end}). DB-ში ახალი ნომრები დაამატე და .preload-phone-counter განაახლე.`);
  }
  fs.writeFileSync(counterFile, String(n));
  return String(n);
}

/**
 * pre-load-ის (KI-456) mailinator მეილი — keepzit01@mailinator.com, keepzit02, keepzit03...
 * ცალკე counter (.keepzit-counter), 2-ციფრიანი padding (100-დან 3 ციფრი).
 */
export function nextKeepzitEmail(): string {
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(__dirname, '..', '.keepzit-counter');
  let n = 1;
  try {
    n = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) + 1;
  } catch {
    n = 1;
  }
  if (!Number.isFinite(n) || n < 1) n = 1;
  fs.writeFileSync(counterFile, String(n));
  return `keepzit${String(n).padStart(2, '0')}@mailinator.com`;
}
