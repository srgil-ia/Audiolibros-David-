// Text-to-speech with the phone's built-in voices (free, works offline on iOS).

function bestVoice(langCode) {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith(langCode.slice(0, 2)));
  return voices.find((v) => v.lang.replace('_', '-') === langCode) || voices[0] || null;
}

export function speak(text, langCode = 'de-DE') {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode;
  u.rate = 0.9;
  const voice = bestVoice(langCode);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
