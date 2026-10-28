# Cómo añadir tarjetas

Hay dos caminos. Los dos usan **el mismo formato JSON**.

## Camino A — Pedírselo a Claude en el repositorio (recomendado)

Abre una sesión de Claude Code sobre este repositorio y pide, por ejemplo:

> «Añade 15 tarjetas al mazo de mindset sobre disciplina»
> «Crea un mazo nuevo de estoicismo, 25 tarjetas»
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
  "id": "mindset",
  "title": { "en": "Mindset", "es": "Mentalidad" },
  "emoji": "🧠",
  "color": "#e07a3f",
  "cards": [
    {
      "id": "mindset-101",
      "tags": ["stress", "control"],
      "hook":   { "en": "Stress doesn't come from hard work.", "es": "El estrés no viene del trabajo duro." },
      "body":   { "en": "It comes from the things you could act on, but don't.\nEpictetus split life in two…", "es": "Viene de lo que podrías resolver y no resuelves.\nEpicteto dividía la vida en dos…" },
      "action": { "en": "Do the first step of one thing you've been avoiding.", "es": "Da el primer paso de algo que llevas evitando." },
      "by": "Epictetus, Enchiridion 1"
    }
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | sí | minúsculas, números y guiones; único en toda la app |
| `tags` | sí | 2–5 temas en inglés, en minúsculas y con guiones. El algoritmo de gustos aprende con ellos |
| `hook` | sí | la frase gancho, máx. ~12 palabras |
| `body` | sí | 2–3 frases cortas (máx. ~50 palabras); `\n` = salto de línea |
| `action` | sí | una cosa concreta para probar hoy |
| `by` | no | autor o estudio de donde sale la idea |
| `emoji`, `color` | no | solo en el mazo |

Reglas de contenido: solo estudios y citas reales; nada de mitos desmentidos (power posing, hábitos en 21 días…).

Se pueden pegar también varios mazos a la vez: `[ {mazo}, {mazo} ]`.
