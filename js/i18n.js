import strings from '../i18n/ui.js';
import { state } from './storage.js';

export const lang = () => state.settings.lang;
export const otherLang = (l = lang()) => (l === 'en' ? 'es' : 'en');

export function t(key, vars = {}) {
  const text = strings[lang()][key] ?? strings.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Pick a bilingual field { en, es }.
export const pick = (field, l = lang()) => (field ? field[l] ?? field.en : '');
