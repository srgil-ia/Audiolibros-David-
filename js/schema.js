// Card / deck format validation. Pure JS: used by the app (Import)
// and by tools/validate.mjs (Node) to check content/*.json.
//
// Deck:
// { id, title:{en,es}, emoji, color, cards:[Card] }
// Card (reel style):
// { id, tags:[], hook:{en,es}, body:{en,es}, action:{en,es}, by? }
//   hook   = the big line that stops the scroll
//   body   = 2–3 short sentences: why it's true (line breaks with \n)
//   action = one small thing to try
//   by     = who the idea or quote comes from (optional)

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isBi = (v) => v && isStr(v.en) && isStr(v.es);

export function validateDeck(deck, where = 'deck') {
  const errors = [];
  const err = (msg) => errors.push(`${where}: ${msg}`);

  if (!deck || typeof deck !== 'object') return [`${where}: not an object`];
  if (!isStr(deck.id) || !/^[a-z0-9-]+$/.test(deck.id)) err('"id" must be lowercase letters, numbers or dashes');
  if (!isBi(deck.title)) err('"title" needs "en" and "es"');
  if (!Array.isArray(deck.cards)) return [...errors, `${where}: "cards" must be a list`];

  const ids = new Set();
  deck.cards.forEach((card, i) => {
    const at = `${where} → card ${i + 1}${card && card.id ? ` (${card.id})` : ''}`;
    for (const e of validateCard(card)) errors.push(`${at}: ${e}`);
    if (card && card.id) {
      if (ids.has(card.id)) errors.push(`${at}: duplicate id`);
      ids.add(card.id);
    }
  });
  return errors;
}

export function validateCard(card) {
  const e = [];
  if (!card || typeof card !== 'object') return ['not an object'];
  if (!isStr(card.id) || !/^[a-z0-9-]+$/.test(card.id)) e.push('"id" must be lowercase letters, numbers or dashes');
  if (!Array.isArray(card.tags) || !card.tags.every(isStr)) e.push('"tags" must be a list of words');
  for (const key of ['hook', 'body', 'action']) {
    if (!isBi(card[key])) e.push(`"${key}" needs "en" and "es"`);
  }
  if (card.by != null && !isStr(card.by)) e.push('"by" must be text');
  return e;
}

// Accepts: a deck, a list of decks, or { decks: [...] }.
export function normalizeImport(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj && Array.isArray(obj.decks)) return obj.decks;
  return [obj];
}
