# Exposé ES — « La Terre est-elle ronde ? »

Site **vidéo plein écran** avec **~10 étapes**, navigation **molette / swipe / clavier / points**, et texte superposé. **GSAP** gère le verrouillage court entre les transitions.

## Lancer en local

```bash
npx serve .
```

Les modules ES nécessitent un **serveur HTTP** (pas `file://`).

## Médias (image ou vidéo)

Fichiers dans **`docs/media/`** — voir `docs/media/README.md`. Le type par étape (**image fixe** ou **vidéo** qui joue jusqu’au swipe suivant, option **boucle**) est défini dans **`src/sections.js`** (`KEYFRAMES[].media`).

## Texte

**`src/content.js`** — clés `step01` … `step10`.

## Structure

- `main.js` — UI, vidéo, navigation
- `src/slideStage.js` — image fixe ou vidéo par étape
- `src/scroll.js` — wheel / touch / verrou
- `src/sections.js` — 10 étapes (fichiers vidéo + clés texte)
- `style.css` — calques vidéo + overlay

## Accessibilité

`prefers-reduced-motion` : la vidéo ne démarre pas en lecture automatique (image / première frame selon navigateur).
