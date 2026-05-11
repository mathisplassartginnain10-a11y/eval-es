# La Terre est-elle ronde ?
### Un exposé. Une scène. Un voyage.

---

## L'expérience.

Pas un site. Une scène spatiale.
Le navigateur s'efface. L'espace prend sa place.
Le texte flotte. Les modèles respirent. La caméra voyage.

Tout se passe dans un seul canvas Three.js, plein écran, sans bord, sans interface visible.
Le contenu n'est pas *sur* la page. Il est *dans* l'espace.

---

## La navigation.

Quatre sections. Quatre zones de l'univers.
On ne clique pas sur des onglets. On scroll.

Chaque section **accroche**. La scène se pose.
La caméra arrive, s'immobilise, laisse le texte apparaître.
Une seconde de silence. Puis le scroll se débloque.
On repart.

> **Scroll snapping obligatoire.** Conçu pour iPad.
> Touch events (`touchstart` / `touchend`) en priorité sur le wheel.
> Le scroll est **verrouillé pendant chaque transition caméra**.
> Seuil de déclenchement : 60px de swipe minimum pour changer de section.
> Durée du lock : durée de l'animation caméra + 800ms de pause.

| # | Section | Ce qu'on voit |
|---|---|---|
| 1 | Introduction | La Terre, loin, dans le noir. |
| 2 | La Terre n'est pas ronde | Descente. Un monde aplati. |
| 3 | La Terre est ronde | Orbite. La lumière du Soleil. |
| 4 | Conclusion | Recul. La Terre s'éloigne. |

---

## La scène.

**Un canvas. Plein écran. 60fps.**

```
Fond                →  #000005. Noir absolu.
Étoiles             →  8 000 particules. Tailles et opacités variées.
Parallaxe           →  Les étoiles suivent la souris. Lerp 0.05.
Lumière Soleil      →  DirectionalLight #fff5e0, intensité 2.5.
Lumière ambiante    →  #0a0a20, intensité 0.15.
Bloom               →  threshold 0.2 — strength 1.4 — radius 0.8.
Vignette            →  offset 0.5 — darkness 0.7.
Antialiasing        →  activé.
Pixel ratio         →  Math.min(devicePixelRatio, 2).
```

---

## Les modèles 3D.

Ils vivent dans `docs/models/`.
Le code va les chercher là. Toujours.

```
docs/models/terre_sphere.glb     →  Sections 1, 3, 4
docs/models/terre_aplatie.glb    →  Section 2
```

**Si un fichier est absent** — pas d'erreur, pas de crash.
Une sphère Three.js prend sa place. Bleue. Discrète. Le show continue.

```js
// fallback automatique dans loader.js
new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 64, 64),
  new THREE.MeshStandardMaterial({ color: 0x1a4fa0 })
)
```

Chaque modèle tourne doucement sur lui-même. `y += 0.0015` par frame.
Il ne s'arrête jamais.

---

## Le texte.

Tout le texte du site vit dans **un seul fichier** : `src/content.js`.
Rien n'est hardcodé ailleurs. Rien.

Le texte sera fourni plus tard.
Pour l'instant, chaque champ contient un placeholder visible et clairement nommé.

```js
// src/content.js
export const CONTENT = {
  intro: {
    titre:       "TITRE À COMPLÉTER",
    sousTitre:   "Sous-titre à compléter",
    paragraphes: ["Paragraphe 1.", "Paragraphe 2."]
  },
  nonRonde: {
    titre:       "TITRE À COMPLÉTER",
    sousTitre:   "Sous-titre à compléter",
    paragraphes: ["Paragraphe 1."]
  },
  ronde: {
    titre:       "TITRE À COMPLÉTER",
    sousTitre:   "Sous-titre à compléter",
    paragraphes: ["Paragraphe 1."]
  },
  conclusion: {
    titre:       "TITRE À COMPLÉTER",
    sousTitre:   "Sous-titre à compléter",
    paragraphes: ["Paragraphe 1."]
  }
}
```

Le texte apparaît en overlay HTML au-dessus du canvas.
Fade in. Translation Y 20px → 0. 800ms. Puis il reste.
Il disparaît au prochain scroll.

---

## La caméra.

Elle ne saute pas. Elle voyage.
GSAP l'anime entre chaque keyframe. `duration: 2.5 — ease: power3.inOut`.

```js
// src/sections.js — keyframes
export const KEYFRAMES = [
  {
    scrollIndex: 0,
    camera:    { x: 0,  y: 2,  z: 10 },
    target:    { x: 0,  y: 0,  z: 0  },
    modelFile: "docs/models/terre_sphere.glb",
    modelScale: 1.4,
    section:   "intro"
  },
  {
    scrollIndex: 1,
    camera:    { x: 3,  y: -1, z: 7  },
    target:    { x: 0,  y: 0,  z: 0  },
    modelFile: "docs/models/terre_aplatie.glb",
    modelScale: 1.6,
    section:   "nonRonde"
  },
  {
    scrollIndex: 2,
    camera:    { x: -4, y: 1,  z: 6  },
    target:    { x: 0,  y: 0,  z: 0  },
    modelFile: "docs/models/terre_sphere.glb",
    modelScale: 1.4,
    section:   "ronde"
  },
  {
    scrollIndex: 3,
    camera:    { x: 0,  y: 3,  z: 18 },
    target:    { x: 0,  y: 0,  z: 0  },
    modelFile: "docs/models/terre_sphere.glb",
    modelScale: 1.0,
    section:   "conclusion"
  }
]
```

---

## Le scroll. Conçu pour iPad.

```
Technologie     →  Touch events natifs. Pas de bibliothèque externe.
Déclenchement   →  Swipe vertical ≥ 60px.
Pendant l'anim  →  Scroll verrouillé. Aucun input accepté.
Après l'anim    →  Pause 800ms. Puis déverrouillage.
Snapping        →  CSS scroll-snap ou JS custom selon perf.
Direction       →  Haut / bas uniquement.
```

```js
// logique dans src/scroll.js
let isTransitioning = false
let currentIndex = 0

function goToSection(index) {
  if (isTransitioning) return
  if (index < 0 || index > 3) return

  isTransitioning = true
  animateCamera(KEYFRAMES[index])          // GSAP, 2.5s
  showText(KEYFRAMES[index].section)       // fade in texte

  setTimeout(() => {
    isTransitioning = false
    currentIndex = index
  }, 2500 + 800)                           // anim + pause
}
```

---

## L'interface.

Discrète. Presque invisible.

```
Indicateur section   →  4 points à droite. Actif = blanc. Inactif = gris 30%.
Barre de progression →  Ligne fine en haut. S'avance section par section.
Nom de section       →  En bas à gauche. Petites capitales. Fade entre sections.
Flèche scroll        →  Section 1 uniquement. Animation bounce. Disparaît au 1er scroll.
```

---

## La typographie.

```
Titres   →  Cormorant Garamond — élégant, spatial, inattendu.
Corps    →  DM Sans — lisible, propre, moderne.
Source   →  Google Fonts.
```

---

## Les fichiers. Dans l'ordre.

```
index.html          →  canvas fullscreen + overlay HTML + importmap
style.css           →  fond noir, overlay texte, UI, transitions
src/scene.js        →  init renderer, caméra, lumières
src/stars.js        →  8 000 étoiles + parallaxe souris
src/loader.js       →  GLTFLoader + fallback sphère
src/sections.js     →  keyframes caméra + modèles
src/scroll.js       →  touch events, lock, snapping, transitions
src/postfx.js       →  EffectComposer, Bloom, Vignette
src/content.js      →  tout le texte — placeholders pour l'instant
docs/models/        →  dossier vide — les .glb seront ajoutés plus tard
docs/models/README  →  expliquer quels fichiers déposer ici
README.md           →  instructions GitHub Pages
```

---

## GitHub Pages.

Tous les chemins sont relatifs.
Aucun build step. Vanilla JS + importmap.
`index.html` à la racine. Toujours.

Tester en local : `npx serve .`

---

*Brief v4 — Cursor edition — 11 mai 2026*
