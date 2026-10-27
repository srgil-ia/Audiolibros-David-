// Checks every deck in content/ against the card format.
// Usage: npm run validate   (or: node tools/validate.mjs)

import { readFileSync } from 'node:fs';
import { validateDeck } from '../js/schema.js';

const dir = new URL('../content/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'));

let errors = 0;
const allIds = new Map();
for (const file of index.decks) {
  const deck = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  const problems = validateDeck(deck, file);
  for (const card of deck.cards || []) {
    if (allIds.has(card.id)) problems.push(`${file}: id "${card.id}" also used in ${allIds.get(card.id)}`);
    allIds.set(card.id, file);
  }
  problems.forEach((p) => console.error('✗', p));
  errors += problems.length;
  console.log(`${problems.length ? '✗' : '✓'} ${file}: ${deck.cards?.length ?? 0} cards`);
}
console.log(`\n${allIds.size} cards in total.`);
process.exit(errors ? 1 : 0);
