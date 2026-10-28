// Builds the "Get more like this" request, to paste into Claude.
// It carries your favourite topics and the exact card format.

import { library } from './content.js';
import { state } from './storage.js';
import { topTags } from './taste.js';

export function buildMorePrompt() {
  const tags = topTags(10).map(([tag]) => tag);
  const deckScores = Object.entries(state.taste.decks).sort((a, b) => b[1] - a[1]);
  const favDeck = deckScores[0]?.[0] || 'mindset';
  const liked = Object.entries(state.cards)
    .filter(([id, st]) => st.liked && library.cards.has(id))
    .slice(-8)
    .map(([id]) => `- ${library.cards.get(id).hook.en}`);
  const deckIds = [...library.decks.keys()].join(', ');

  return `I use "Mise", my personal app of short mindset & psychology cards (like Instagram reels in text). I'm David, Spanish, English C1, working in hospitality and about to lead a team.

Please create 10 NEW cards I'll enjoy, focused on these topics: ${tags.length ? tags.join(', ') : 'stress, discipline, confidence, leadership'}.
Cards I liked recently:
${liked.length ? liked.join('\n') : '- (none yet)'}

Rules:
- Style of a great short reel: a punchy "hook" (max ~12 words), a "body" of 2–3 short sentences (max ~50 words) explaining why, and one concrete "action" to try today.
- Accurate content only: real studies and real quotes. Put the author/study in "by". Don't use debunked findings (power posing, 21-day habits, etc.).
- Every text field in English ("en") and Spanish ("es").
- Use the deck id "${favDeck}" unless another fits better (existing decks: ${deckIds}).
- Card ids must be unique, e.g. "${favDeck}-x-001".
- Answer ONLY with the JSON, no comments.

Format:
{
  "id": "${favDeck}",
  "title": { "en": "...", "es": "..." },
  "cards": [
    {
      "id": "${favDeck}-x-001",
      "tags": ["topic-a", "topic-b"],
      "hook":   { "en": "...", "es": "..." },
      "body":   { "en": "...", "es": "..." },
      "action": { "en": "...", "es": "..." },
      "by": "Author, source (optional)"
    }
  ]
}`;
}
