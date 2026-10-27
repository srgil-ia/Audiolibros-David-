// Lists the narration text of every card that has no audio file yet.
// Usage: node tools/narration.mjs [deckFile]   → JSON lines { id, lang, chars, text }

import { readFileSync, existsSync } from 'node:fs';
import { narrationText, narrationLang } from '../js/narration.js';

const root = new URL('../', import.meta.url);
const index = JSON.parse(readFileSync(new URL('content/index.json', root), 'utf8'));
const only = process.argv[2];

for (const file of index.decks) {
  if (only && file !== only) continue;
  const deck = JSON.parse(readFileSync(new URL(`content/${file}`, root), 'utf8'));
  for (const card of deck.cards) {
    if (existsSync(new URL(`audio/${card.id}.mp3`, root))) continue;
    const text = narrationText(card);
    console.log(JSON.stringify({ id: card.id, lang: narrationLang(card), chars: text.length, text }));
  }
}
