// Builds the "Get more like this" request, to paste into Claude.
// It carries your favourite topics and the exact card format.

import { library } from './content.js';
import { state } from './storage.js';
import { topTags } from './taste.js';

export function buildMorePrompt() {
  const tags = topTags(10).map(([tag]) => tag);
  const deckScores = Object.entries(state.taste.decks).sort((a, b) => b[1] - a[1]);
  const favDeck = deckScores[0]?.[0] || 'team';
  const liked = Object.entries(state.cards)
    .filter(([id, st]) => st.liked && library.cards.has(id))
    .slice(-8)
    .map(([id]) => `- ${library.cards.get(id).title.en}`);
  const deckIds = [...library.decks.keys()].join(', ');

  return `I use "Mise", my personal microlearning app. I'm David, sommelier and chef de rang in a 5-star hotel in Zermatt (Switzerland), becoming Chef de Service in January 2027. Spanish native, English C1, learning German.

Please create 10 NEW cards I'll enjoy, focused on these topics: ${tags.length ? tags.join(', ') : 'leadership, Swiss wine, German for service'}.
Cards I liked recently:
${liked.length ? liked.join('\n') : '- (none yet)'}

Rules:
- Accurate, verifiable content only. Each "idea" max 3–4 sentences.
- "example": a concrete situation in the dining room of a luxury hotel restaurant.
- Every text field in English ("en") and Spanish ("es").
- Use the deck id "${favDeck}" unless another fits better (existing decks: ${deckIds}).
- Card ids must be unique, e.g. "${favDeck}-x-001".
- Answer ONLY with the JSON, no comments.

Format (normal card):
{
  "id": "${favDeck}",
  "title": { "en": "...", "es": "..." },
  "cards": [
    {
      "id": "${favDeck}-x-001",
      "tags": ["topic-a", "topic-b"],
      "title":   { "en": "...", "es": "..." },
      "idea":    { "en": "...", "es": "..." },
      "example": { "en": "...", "es": "..." },
      "quiz": { "q": { "en": "...", "es": "..." }, "a": { "en": "...", "es": "..." } }
    }
  ]
}
"quiz" is optional.

For German phrase cards (deck "german") use instead:
{ "id": "german-x-001", "tags": ["..."], "title": {"en","es"},
  "de": { "text": "German phrase", "pron": "approximate pronunciation for a Spanish speaker, stressed syllable in CAPITALS" },
  "translation": { "en": "...", "es": "..." },
  "idea": { "en": "short usage note", "es": "..." } }`;
}
