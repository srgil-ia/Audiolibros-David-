// Saved cards: an ideas bank for Instagram posts.

import { h, toast, copyText } from '../dom.js';
import { icons } from '../icons.js';
import { t, pick } from '../i18n.js';
import { library } from '../content.js';
import { state, save } from '../storage.js';

export function renderSaved(container) {
  const saved = Object.entries(state.cards)
    .filter(([id, st]) => st.saved && library.cards.has(id))
    .sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0))
    .map(([id]) => library.cards.get(id));

  const items = saved.map((card) => {
    const deck = library.decks.get(card.deck) || {};
    const item = h('details.saved-item', { style: { '--deck': deck.color || 'var(--accent)' } },
      h('summary', {},
        h('span.saved-emoji', {}, deck.emoji || '•'),
        h('span.saved-title', {}, card.de ? card.de.text : pick(card.title))),
      h('div.saved-body', {},
        card.de && h('p.muted', {}, pick(card.translation)),
        card.idea && h('p', {}, pick(card.idea)),
        card.example && h('p.muted', {}, pick(card.example)),
        h('div.row', {},
          h('button.btn.small', {
            onclick: async () => {
              if (await copyText(cardToText(card))) toast(t('saved.copied'));
            },
          }, h('span', { html: icons.copy }), t('saved.copy')),
          h('button.btn.small.ghost', {
            onclick: () => {
              state.cards[card.id].saved = false;
              save();
              item.remove();
            },
          }, t('saved.remove')))));
    return item;
  });

  container.replaceChildren(
    h('h1.page-title', {}, t('saved.title')),
    h('p.page-sub', {}, t('saved.subtitle')),
    saved.length
      ? h('button.btn.small.ghost.copy-all', {
          onclick: async () => {
            if (await copyText(saved.map(cardToText).join('\n\n———\n\n'))) toast(t('saved.copied'));
          },
        }, t('saved.copyAll'))
      : h('p.empty', {}, t('saved.empty')),
    ...items,
  );
}

// Plain text in both languages, ready to adapt into a post.
export function cardToText(card) {
  const block = (l) => {
    if (card.de) {
      return [card.de.text, `(${card.de.pron})`, card.translation[l], card.idea?.[l]].filter(Boolean).join('\n');
    }
    return [card.title[l], card.idea[l], card.example ? `→ ${card.example[l]}` : ''].filter(Boolean).join('\n\n');
  };
  return `${block('en')}\n\n— ES —\n${block('es')}`;
}
