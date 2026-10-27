# Mise — microlearning para sala

App personal de microlearning (estilo TikTok/Deepstash) para David: gestión de equipos, vino suizo, alemán e inglés para servicio de lujo.

- **PWA**: se instala en el iPhone y funciona sin conexión.
- **Feed vertical infinito**: una tarjeta por pantalla; tocar = traducir EN/ES, doble toque = me gusta.
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
  team.json  wine.json  german.json  english.json
js/
  app.js                arranque, pestañas, tema
  storage.js            todo lo que se guarda en el móvil
  content.js            carga de mazos + importación
  schema.js             formato válido de tarjetas (lo usa la app y el validador)
  srs.js                repetición espaciada
  taste.js              algoritmo de recomendación ("lo que te gusta")
  stats.js              racha y objetivo diario
  prompt.js             texto del botón "Get more like this"
  speech.js             voz alemana del propio iPhone
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
