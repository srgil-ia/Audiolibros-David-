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
        h('span.saved-title', {}, pick(card.hook))),
      h('div.saved-body', {},
        h('p.pre', {}, pick(card.body)),
        h('p.muted', {}, `→ ${pick(card.action)}`),
        card.by && h('p.muted', {}, `— ${card.by}`),
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
  const block = (l) =>
    [card.hook[l], card.body[l], `→ ${card.action[l]}`, card.by ? `— ${card.by}` : ''].filter(Boolean).join('\n\n');
  return `${block('en')}\n\n— ES —\n${block('es')}`;
}
