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