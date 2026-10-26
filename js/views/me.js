// Profile: stats, taste, settings, import and backup.

import { h, toast, copyText } from '../dom.js';
import { icons } from '../icons.js';
import { t } from '../i18n.js';
import { state, flush, exportBackup, restoreBackup, resetTaste, resetAll, BACKUP_KIND } from '../storage.js';
import { importDecks } from '../content.js';
import { topTags } from '../taste.js';
import { streak, bestStreak, todayCount, totalRead } from '../stats.js';
import { buildMorePrompt } from '../prompt.js';

// onChange(kind) lets the app react: 'lang' | 'theme' | 'goal' | 'content' | 'data'
export function renderMe(container, { onChange }) {
  const rerender = () => renderMe(container, { onChange });

  const stat = (value, label) => h('div.stat', {}, h('div.stat-value', {}, String(value)), h('div.stat-label', {}, label));

  const tags = topTags(10);
  const max = tags[0]?.[1] || 1;
  const tasteBlock = tags.length
    ? h('div.chips', {}, tags.map(([tag, v]) =>
        h('span.chip', { style: { '--w': 0.25 + 0.75 * (v / max) } }, `#${tag}`)))
    : h('p.muted', {}, t('me.tasteEmpty'));

  const segmented = (options, current, onPick) =>
    h('div.segmented', {}, options.map(([value, label]) =>
      h('button', { class: value === current ? 'on' : '', onclick: () => onPick(value) }, label)));

  const setSetting = (key, value) => {
    state.settings[key] = value;
    flush();
    onChange(key);
    rerender();
  };

  const textarea = h('textarea.import-box', {
    placeholder: '{ "id": "wine", "title": {...}, "cards": [...] }',
    rows: 5,
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
  });
  const result = h('div.import-result');

  const doImport = () => {
    result.replaceChildren();
    let obj;
    try {
      obj = JSON.parse(textarea.value.trim());
    } catch {
      result.append(h('p.error', {}, t('me.importBad')));
      return;
    }
    if (obj && obj.kind === BACKUP_KIND) {
      if (!confirm(t('me.restoreConfirm'))) return;
      restoreBackup(obj);
      toast(t('me.restored'));
      onChange('data');
      rerender();
      return;
    }
    const res = importDecks(obj);
    if (res.errors.length) {
      result.append(...res.errors.slice(0, 12).map((e) => h('p.error', {}, e)));
      return;
    }
    textarea.value = '';
    result.append(h('p.ok', {}, t('me.importOk', res)));
    onChange('content');
  };

  container.replaceChildren(
    h('h1.page-title', {}, t('me.title')),

    h('div.stats', {},
      stat(`🔥 ${streak()}`, t('me.streak')),
      stat(`${todayCount()}/${state.settings.goal}`, t('me.today')),
      stat(bestStreak(), t('me.best')),
      stat(totalRead(), t('me.total'))),

    h('h2.section', {}, t('me.taste')),
    tasteBlock,
    h('button.btn.primary.wide', {
      onclick: async () => {
        if (await copyText(buildMorePrompt())) toast(t('me.moreCopied'), 3000);
      },
    }, h('span', { html: icons.sparkle }), t('me.more')),
    h('p.hint', {}, t('me.moreSub')),

    h('h2.section', {}, t('me.settings')),
    h('div.setting', {}, h('span', {}, t('me.lang')),
      segmented([['en', 'English'], ['es', 'Español']], state.settings.lang, (v) => setSetting('lang', v))),
    h('div.setting', {}, h('span', {}, t('me.theme')),
      segmented([['auto', t('me.themeAuto')], ['light', t('me.themeLight')], ['dark', t('me.themeDark')]],
        state.settings.theme, (v) => setSetting('theme', v))),
    h('div.setting', {}, h('span', {}, t('me.goal')),
      segmented([[5, '5'], [10, '10'], [15, '15'], [20, '20']], state.settings.goal, (v) => setSetting('goal', v))),

    h('h2.section', {}, t('me.content')),
    h('div.panel', {},
      h('div.panel-title', {}, t('me.import')),
      h('p.hint', {}, t('me.importSub')),
      textarea,
      h('div.row', {},
        h('button.btn.small.ghost', {
          onclick: async () => {
            try {
              textarea.value = await navigator.clipboard.readText();
            } catch {
              textarea.focus();
            }
          },
        }, t('me.paste')),
        h('button.btn.small.primary', { onclick: doImport }, t('me.importBtn'))),
      result),

    h('div.panel', {},
      h('div.panel-title', {}, t('me.backup')),
      h('p.hint', {}, t('me.backupSub')),
      h('button.btn.small', {
        onclick: async () => {
          flush();
          if (await copyText(exportBackup())) toast(t('me.backupCopied'));
        },
      }, h('span', { html: icons.copy }), t('me.backup'))),

    h('div.row.danger-row', {},
      h('button.btn.small.ghost', {
        onclick: () => {
          if (!confirm(t('me.resetTasteConfirm'))) return;
          resetTaste();
          toast(t('me.done'));
          rerender();
        },
      }, t('me.resetTaste')),
      h('button.btn.small.danger', {
        onclick: () => {
          if (!confirm(t('me.resetAllConfirm'))) return;
          resetAll();
          toast(t('me.done'));
          onChange('data');
          rerender();
        },
      }, t('me.resetAll'))),

    h('p.footer', {}, t('me.version')),
  );
}
