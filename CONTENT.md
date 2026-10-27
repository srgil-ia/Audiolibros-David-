# Cómo añadir tarjetas

Hay dos caminos. Los dos usan **el mismo formato JSON**.

## Camino A — Pedírselo a Claude en el repositorio (recomendado)

Abre una sesión de Claude Code sobre este repositorio y pide, por ejemplo:

> «Añade 15 tarjetas al mazo de vino sobre Champagne y espumosos»
> «Crea un mazo nuevo de cócteles clásicos, 25 tarjetas»
> «Estos son mis temas favoritos: …(pega lo que copia el botón *Get more like this*)…»

Claude edita `content/*.json`, ejecuta `node tools/validate.mjs`, sube la versión del service worker y publica. La próxima vez que abras la app (dos aperturas como mucho), las tarjetas nuevas estarán ahí, **sin perder tu progreso**.

## Camino B — Importar dentro de la app

1. En la app: **Me → Get more like this**. Copia una petición con tus temas favoritos y el formato.
2. Pégala en Claude (o cualquier asistente) y copia el JSON que te devuelva.
3. En la app: **Me → Import cards → Paste → Import**.

Las tarjetas importadas se guardan solo en ese móvil (y en la copia de seguridad).

## Formato

Un mazo es un objeto con `id`, `title` y `cards`. Si el `id` del mazo ya existe, las tarjetas se añaden a ese mazo. Si el `id` de una tarjeta ya existe, se sustituye.

```json
{
  "id": "wine",
  "title": { "en": "Wine & sommellerie", "es": "Vino y sumillería" },
  "emoji": "🍷",
  "color": "#a3324f",
  "cards": [
    {
      "id": "wine-101",
      "tags": ["champagne", "sparkling"],
      "title":   { "en": "Blanc de Blancs", "es": "Blanc de Blancs" },
      "idea":    { "en": "A Champagne made only from white grapes, usually Chardonnay…", "es": "Un champán elaborado solo con uvas blancas, normalmente Chardonnay…" },
      "example": { "en": "\"For the oysters, a Blanc de Blancs: …\"", "es": "«Para las ostras, un Blanc de Blancs: …»" },
      "quiz": {
        "q": { "en": "Which grape is usually behind a Blanc de Blancs?", "es": "¿Qué uva suele haber detrás de un Blanc de Blancs?" },
        "a": { "en": "Chardonnay.", "es": "Chardonnay." }
      }
    }
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | sí | minúsculas, números y guiones; único en toda la app |
| `tags` | sí | 2–5 temas en inglés, en minúsculas y con guiones (`team-building`). El algoritmo de gustos aprende con ellos |
| `title` | sí | `{ "en", "es" }` |
| `idea` | sí* | máximo 3–4 frases |
| `example` | sí* | situación concreta en sala de un hotel de lujo |
| `quiz` | no | `{ "q": {en, es}, "a": {en, es} }` |
| `emoji`, `color` | no | solo en el mazo |

### Tarjetas de idiomas (alemán)

```json
{
  "id": "german-101",
  "tags": ["wine", "recommending"],
  "title": { "en": "Describing a wine", "es": "Describir un vino" },
  "de": { "text": "Dieser Wein ist frisch und mineralisch.", "pron": "DI-zer vain ist frish unt mi-ne-RA-lish" },
  "translation": { "en": "This wine is fresh and mineral.", "es": "Este vino es fresco y mineral." },
  "idea": { "en": "Short usage note.", "es": "Nota breve de uso." }
}
```

- `pron`: pronunciación aproximada para hispanohablante, sílaba tónica en MAYÚSCULAS.
- Ortografía suiza: `ss` en lugar de `ß`.
- `idea`, `example` y `quiz` son opcionales en estas tarjetas.

Se pueden pegar también varios mazos a la vez: `[ {mazo}, {mazo} ]`.
