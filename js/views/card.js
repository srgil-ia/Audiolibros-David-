// One full-screen card in the feed: content + TikTok-style action rail.
// Reel layout: a big hook, a short "why" and one thing to try.

import { h } from '../dom.js';
import { icons } from '../icons.js';
import { t, pick, lang, otherLang } from '../i18n.js';
import { library } from '../content.js';

// Renders the card. `handlers` = { onLike, onSave, onAgain, onTranslate }
// Returns { el, setLiked(b), setSaved(b), fit(), setProgress(f) }
// — call fit() once the card is in the page; setProgress(0..1 | null) drives
// the read-along subtitles while the narration plays.
export function renderCard(card, cardSt, handlers) {
  const deck = library.decks.get(card.deck) || {};
  let shown = lang();
  let words = []; // read-along: [{ el, at }] with `at` = char offset in the narration
  let chars = 0;
  let lastWord = -1;
  let progress = null;

  const body = h('div.card-body');
  const deckLabel = h('div.card-deck', {}, deck.emoji ? `${deck.emoji} ` : '', '');

  const likeBtn = railButton(icons.heart, t('feed.like'), handlers.onLike, 'like');
  const saveBtn = railButton(icons.bookmark, t('feed.save'), handlers.onSave, 'save');
  const langBtn = railButton(icons.translate, '', () => toggleLang(), 'lang');
  const againBtn = railButton(icons.again, t('feed.again'), handlers.onAgain, 'again');

  const rail = h('div.rail', {}, likeBtn, saveBtn, langBtn, againBtn);

  const bar = h('span');
  const el = h(
    'article.card',
    { style: { '--deck': deck.color || 'var(--accent)' }, dataset: { id: card.id } },
    h('div.card-glow'),
    h('div.card-progress', {}, bar),
    h('div.card-inner', {}, deckLabel, body),
    rail,
  );

  function draw() {
    words = [];
    chars = 0;
    lastWord = -1;
    deckLabel.lastChild.textContent = pick(deck.title, shown);
    langBtn.querySelector('.rail-label').textContent = otherLang(shown).toUpperCase();
    const en = shown === 'en'; // only the English text is narrated
    // Char offsets follow narrationText(): hook, body and action joined by spaces.
    const hook = h('h2.card-hook', {}, spoken(pick(card.hook, shown), en));
    chars += 1;
    const text = h('p.card-text', {}, spoken(pick(card.body, shown), en));
    chars += 1;
    const action = h('div.card-action', {},
      h('span.label', {}, t('feed.try')),
      h('p', {}, spoken(pick(card.action, shown), en)));
    body.replaceChildren(hook, text, action, card.by ? h('p.card-by', {}, `— ${card.by}`) : '');
    fit();
    setProgress(progress);
  }

  // Splits narrated text into word spans for the read-along highlight.
  function spoken(text, narrated) {
    if (!narrated) return text;
    return text.split(/(\s+)/).map((part) => {
      if (!part.trim()) {
        chars += part.length;
        return part;
      }
      const w = h('span.w', {}, part);
      words.push({ el: w, at: chars });
      chars += part.length;
      return w;
    });
  }

  function setProgress(f) {
    progress = f;
    el.classList.toggle('playing', f != null);
    bar.style.width = `${(f || 0) * 100}%`;
    const pos = f * chars;
    let idx = -1;
    if (f != null) while (idx + 1 < words.length && words[idx + 1].at <= pos) idx++;
    if (idx === lastWord) return;
    words.forEach((w, i) => {
      w.el.classList.toggle('done', i < idx);
      w.el.classList.toggle('now', i === idx);
    });
    lastWord = idx;
    if (idx >= 0) keepVisible(words[idx].el);
  }

  // Long cards scroll inside: follow the voice.
  function keepVisible(wordEl) {
    const inner = el.querySelector('.card-inner');
    if (inner.scrollHeight <= inner.clientHeight) return;
    const top = wordEl.offsetTop - inner.offsetTop;
    if (top < inner.scrollTop + 40 || top > inner.scrollTop + inner.clientHeight - 80) {
      inner.scrollTo({ top: Math.max(0, top - inner.clientHeight / 3), behavior: 'smooth' });
    }
  }

  // Shrink the text a step or two when the card doesn't fit the screen.
  function fit() {
    el.classList.remove('dense', 'denser');
    if (!el.isConnected) return;
    const inner = el.querySelector('.card-inner');
    const overflows = () => inner.scrollHeight > inner.clientHeight + 1;
    if (!overflows()) return;
    el.classList.add('dense');
    if (!overflows()) return;
    el.classList.replace('dense', 'denser');
  }

  function toggleLang() {
    shown = otherLang(shown);
    draw();
    handlers.onTranslate?.();
  }

  // Single tap = translate, double tap = like (like TikTok).
  let tapTimer = null;
  el.querySelector('.card-inner').addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
      if (!likeBtn.classList.contains('on')) handlers.onLike();
      burst(el);
      return;
    }
    tapTimer = setTimeout(() => {
      tapTimer = null;
      toggleLang();
    }, 260);
  });

  const api = {
    el,
    setLiked: (on) => likeBtn.classList.toggle('on', !!on),
    setSaved: (on) => saveBtn.classList.toggle('on', !!on),
    fit,
    setProgress,
  };
  api.setLiked(cardSt.liked);
  api.setSaved(cardSt.saved);
  draw();
  return api;
}

function railButton(icon, label, onclick, kind) {
  return h('button.rail-btn', {
    class: `rail-${kind}`,
    'aria-label': label || kind,
    onclick: (e) => {
      e.stopPropagation();
      onclick?.();
    },
  }, h('span.rail-icon', { html: icon }), h('span.rail-label', {}, label));
}

function burst(el) {
  const heart = h('div.burst', { html: icons.heart });
  el.append(heart);
  setTimeout(() => heart.remove(), 700);
}
