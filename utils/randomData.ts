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

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
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