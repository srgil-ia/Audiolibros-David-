// Deck list: stats per deck and "focus the feed" on one deck.

import { h } from '../dom.js';
import { icons } from '../icons.js';
import { t, pick } from '../i18n.js';
import { library, cardsOf } from '../content.js';
import { cardState } from '../storage.js';
import { isDue } from '../srs.js';

export function renderDecks(container, { onFocus }) {
  const now = Date.now();
  const tiles = [...library.decks.values()].map((deck) => {
    const cards = cardsOf(deck.id);
    const seen = cards.filter((c) => cardState(c.id).seen > 0).length;
    const due = cards.filter((c) => isDue(c.id, now)).length;
    const pct = cards.length ? seen / cards.length : 0;
    return h('button.deck-tile', { style: { '--deck': deck.color || 'var(--accent)' }, onclick: () => onFocus(deck.id) },
      h('div.deck-emoji', {}, deck.emoji || '•'),
      h('div.deck-info', {},
        h('div.deck-name', {}, pick(deck.title)),
        h('div.deck-meta', {},
          `${cards.length} ${t('decks.cards')} · ${seen} ${t('decks.seen')}`,
          due ? h('span.due', {}, ` · ${due} ${t('decks.due')}`) : null),
        h('div.bar', {}, h('span', { style: { width: `${Math.round(pct * 100)}%` } }))),
      h('span.chev', { html: icons.chevron }));
  });

  container.replaceChildren(
    h('h1.page-title', {}, t('decks.title')),
    h('p.page-sub', {}, t('decks.subtitle')),
    h('button.deck-tile.mix', { onclick: () => onFocus(null) },
      h('div.deck-emoji', { html: icons.sparkle }),
      h('div.deck-info', {},
        h('div.deck-name', {}, t('decks.mix')),
        h('div.deck-meta', {}, t('decks.mixSub'))),
      h('span.chev', { html: icons.chevron })),
    ...tiles,
  );
}
