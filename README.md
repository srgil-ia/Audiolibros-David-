# Mise — mentalidad y psicología en formato reel

App personal de microlearning (estilo TikTok/Deepstash) para David: ideas cortas de mentalidad, psicología y liderazgo, en inglés con traducción al español.

- **PWA**: se instala en el iPhone y funciona sin conexión.
- **Feed vertical infinito**: una tarjeta por pantalla con gancho, explicación corta y algo para probar; tocar = traducir EN/ES, doble toque = me gusta.
- **Modo vídeo**: la voz lee la tarjeta en bucle con subtítulos tipo karaoke y música lo‑fi generada, hasta que haces scroll.
- **Aprende tus gustos**: los me gusta, las tarjetas guardadas, el tiempo de lectura y los saltos rápidos ajustan qué temas aparecen más.
- **Repetición espaciada** integrada en el scroll: las tarjetas leídas vuelven cuando toca; el botón ↻ las trae antes.
- **Racha y objetivo diario**, tarjetas guardadas para ideas de Instagram, importación de JSON.
- Sin cuentas, sin servidor, sin costes: todo se guarda en el móvil.

## Estructura

```
index.html              página única
manifest.webmanifest    datos de instalación (nombre, iconos)
sw.js                   service worker (offline). Sube VERSION al cambiar código
css/styles.css          diseño (tokens de color claro/oscuro arriba del todo)
i18n/ui.js              textos de la interfaz en inglés y español
content/                ← EL CONTENIDO (un JSON por mazo)
  index.json            lista de mazos que carga la app
  mindset.json  psychology.json  leadership.json
js/
  app.js                arranque, pestañas, tema
  storage.js            todo lo que se guarda en el móvil
  content.js            carga de mazos + importación
  schema.js             formato válido de tarjetas (lo usa la app y el validador)
  srs.js                repetición espaciada
  taste.js              algoritmo de recomendación ("lo que te gusta")
  stats.js              racha y objetivo diario
  prompt.js             texto del botón "Get more like this"
  player.js  music.js    voz en bucle + música lo-fi
  narration.js          qué texto lee la voz
  views/                pantallas: feed, card, decks, saved, me
tools/validate.mjs      comprueba que el contenido es correcto
```

## Probar en local

```bash
python3 -m http.server 8080     # y abre http://localhost:8080
node tools/validate.mjs         # valida content/*.json
```

## Añadir contenido

Ver [CONTENT.md](CONTENT.md).
