# Exposé ES — « La Terre est-elle ronde ? »

Site web **immersif** (Three.js + GSAP ScrollTrigger) servant de support à un exposé oral. La navigation se fait au **défilement** : la caméra se déplace dans une scène 3D continue.

## Lancer en local

À la racine du projet :

```bash
npx serve .
```

Ouvrez l’URL indiquée (souvent `http://localhost:3000`). Les modules ES et les CDN nécessitent un **serveur HTTP** (pas d’ouverture directe en `file://`).

## GitHub Pages

- `index.html` est à la racine.
- Aucune étape de build : fichiers statiques + `importmap` (Three.js r160) et scripts GSAP (UMD) pour ScrollTrigger.
- Les chemins vers les modèles sont **relatifs** (`./docs/models/...`).

## Contenu texte

Tout le texte est centralisé dans **`src/content.js`**. Remplissez les titres, sous-titres et paragraphes sans modifier le reste du code.

## Modèles 3D

Voir **`docs/models/README.md`**. Fichiers attendus : `terre_sphere.glb`, `terre_aplatie.glb`. En cas d’absence, une sphère de secours s’affiche.

## Structure

- `main.js` — orchestration
- `src/scene.js` — scène, lumières, renderer
- `src/stars.js` — étoiles procédurales + parallaxe souris
- `src/loader.js` — GLTFLoader + fallback
- `src/scroll.js` — ScrollTrigger
- `src/sections.js` — keyframes caméra / modèles
- `src/postfx.js` — bloom + vignette
- `style.css` — UI et fond nébuleuse

## Accessibilité

Le site respecte `prefers-reduced-motion` (animations et parallaxe atténuées ou désactivées).
