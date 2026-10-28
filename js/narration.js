// What the voice says for each card. Shared by the app (subtitles, phone
// voice) and tools/narration.mjs (to generate audio files, if ever needed).
// Keep in sync with the char offsets in views/card.js: parts joined by one space.

export function narrationText(card) {
  return [card.hook.en, card.body.en, card.action.en].join(' ');
}
