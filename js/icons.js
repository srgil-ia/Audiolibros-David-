// Inline SVG icons (stroke style, inherit currentColor).

const svg = (paths, fill = 'none') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
  bookmark: svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  translate: svg('<path d="M4 5h8M8 3v2M5.5 5c1 3.5 3.5 6 6.5 7.5M10.5 5c-1 3.5-3.5 6.5-6.5 8"/><path d="M13 21l4-9 4 9M14.5 18h5"/>'),
  again: svg('<path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>'),
  speaker: svg('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  mute: svg('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6"/>'),
  music: svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  feed: svg('<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M9 18h6"/>'),
  decks: svg('<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'),
  me: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  close: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  chevron: svg('<path d="M9 18l6-6-6-6"/>'),
  flame: svg('<path d="M12 22c4.4 0 7-2.9 7-6.8 0-4.2-3.3-6.9-4.5-10.2-.3-.8-1.3-.9-1.7-.2-.9 1.5-1.2 3.3-2.8 4.4C9 8 8.6 6.6 8.4 5.8c-.2-.7-1.1-.9-1.5-.3C5.6 7.6 5 9.6 5 12.2 5 17.7 7.6 22 12 22z"/>'),
  sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
};
