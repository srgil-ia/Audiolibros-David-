// What the voice says for each card. Shared by the app (subtitles, phone
// voice fallback) and tools/narration.mjs (to generate the audio files).

export function narrationText(card) {
  if (card.de) return `${card.de.text} … ${card.de.text}`;
  const text = `${card.title.en}. ${card.idea.en} In the room: ${card.example.en}`;
  return text
    .replace(/ \([A-Z]\)/g, '') // drop SBI-style "(S)" markers
    .replace(/ → /g, ' becomes ');
}

export function narrationLang(card) {
  return card.de ? 'de-DE' : 'en-GB';
}
