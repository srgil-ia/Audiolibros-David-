// One full-screen card in the feed: content + TikTok-style action rail.

import { h } from '../dom.js';
import { icons } from '../icons.js';
import { t, pick, lang, otherLang } from '../i18n.js';
import { library } from '../content.js';

// Renders the card. `handlers` = { onLike, onSave, onAgain, onTranslate, onSpeak }
// Returns { el, setLiked(b), setSaved(b), fit() }  — call fit() once the card is in the page.
export function renderCard(card, cardSt, handlers) {
  const deck = library.decks.get(card.deck) || {};
  let shown = lang();
  let revealed = false; // German translation revealed
  let quizStep = 0; // 0 closed, 1 question, 2 answer

  const body = h('div.card-body');
  const deckLabel = h('div.card-deck', {}, deck.emoji ? `${deck.emoji} ` : '', '');

  const likeBtn = railButton(icons.heart, t('feed.like'), handlers.onLike, 'like');
  const saveBtn = railButton(icons.bookmark, t('feed.save'), handlers.onSave, 'save');
  const langBtn = railButton(icons.translate, '', () => toggleLang(), 'lang');
  const againBtn = railButton(icons.again, t('feed.again'), handlers.onAgain, 'again');
  const speakBtn = card.de ? railButton(icons.speaker, t('feed.listen'), handlers.onSpeak, 'speak') : null;

  const rail = h('div.rail', {}, likeBtn, saveBtn, langBtn, againBtn, speakBtn);

  const el = h(
    'article.card',
    { style: { '--deck': deck.color || 'var(--accent)' }, dataset: { id: card.id } },
    h('div.card-inner', {}, deckLabel, body),
    rail,
  );

  function draw() {
    deckLabel.lastChild.textContent = pick(deck.title, shown);
    langBtn.querySelector('.rail-label').textContent = otherLang(shown).toUpperCase();
    body.replaceChildren(...(card.de ? phraseContent() : ideaContent()).filter(Boolean));
    fit();
  }

  function ideaContent() {
    return [
      h('h2.card-title', {}, pick(card.title, shown)),
      h('p.card-idea', {}, pick(card.idea, shown)),
      h('div.card-example', {},
        h('span.label', {}, t('feed.example')),
        h('p', {}, pick(card.example, shown)),
      ),
      quizBlock(),
    ];
  }

  function phraseContent() {
    const tr = revealed
      ? h('div.card-translation', {},
          h('p', {}, h('b', {}, 'EN '), card.translation.en),
          h('p', {}, h('b', {}, 'ES '), card.translation.es))
      : h('div.card-translation.hint', {}, t('feed.tapTranslate'));
    return [
      h('div.card-situation', {}, pick(card.title, shown)),
      h('p.card-phrase', { lang: 'de' }, card.de.text),
      h('p.card-pron', {}, h('span.label', {}, t('feed.pron')), ' ', card.de.pron),
      tr,
      card.idea && h('div.card-example', {},
        h('span.label', {}, t('feed.note')),
        h('p', {}, pick(card.idea, shown))),
      card.example && h('div.card-example', {},
        h('span.label', {}, t('feed.example')),
        h('p', {}, pick(card.example, shown))),
      quizBlock(),
    ];
  }

  // Collapsed by default to keep the card short: tap to see the question,
  // tap again to see the answer.
  function quizBlock() {
    if (!card.quiz) return null;
    if (quizStep === 0) {
      return h('button.quiz-toggle', { onclick: (e) => { e.stopPropagation(); quizStep = 1; draw(); } },
        '❓ ', t('feed.quiz'));
    }
    return h('div.card-quiz', {},
      h('span.label', {}, t('feed.quiz')),
      h('p.quiz-q', {}, pick(card.quiz.q, shown)),
      quizStep === 2
        ? h('p.quiz-a', {}, pick(card.quiz.a, shown))
        : h('button.quiz-btn', { onclick: (e) => { e.stopPropagation(); quizStep = 2; draw(); } }, t('feed.showAnswer')));
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
    if (card.de && !revealed) revealed = true;
    else shown = otherLang(shown);
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
