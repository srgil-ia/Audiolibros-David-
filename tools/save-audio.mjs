// Downloads a generated narration, compresses it and records it in audio/index.json.
// Usage: node tools/save-audio.mjs <cardId> <url> [exact narrated text]

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { narrationText } from '../js/narration.js';

const [id, url, customText] = process.argv.slice(2);
const root = new URL('../', import.meta.url);
const out = new URL(`audio/${id}.mp3`, root).pathname;
const tmp = `${out}.download`;

const res = await fetch(url);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tmp, '-ac', '1', '-b:a', '64k', out]);
unlinkSync(tmp);
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());

let text = customText;
if (!text) {
  const index = JSON.parse(readFileSync(new URL('content/index.json', root), 'utf8'));
  for (const file of index.decks) {
    const card = JSON.parse(readFileSync(new URL(`content/${file}`, root), 'utf8')).cards.find((c) => c.id === id);
    if (card) text = narrationText(card);
  }
}
if (!text) throw new Error(`Unknown card ${id}`);

const manifestPath = new URL('audio/index.json', root);
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
manifest[id] = { dur: Math.round(dur * 100) / 100, text };
writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
console.log(`✓ ${id} ${dur.toFixed(1)}s`);
