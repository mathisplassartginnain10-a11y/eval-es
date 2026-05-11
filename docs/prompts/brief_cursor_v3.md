# 🌍 BRIEF CURSOR — Exposé Enseignement Scientifique
## « La Terre est-elle ronde ? »
### Site web 3D immersif — Three.js / WebGL / GSAP

---

## 🎯 Objectif

Créer un site web **entièrement immersif** servant de support à un exposé oral en classe.
Ce n'est **pas** un site classique. C'est une **expérience spatiale en temps réel** dans le navigateur.
Le rendu 3D **est** la page. Il n'y a pas de séparation entre le contenu et la scène.

---

## 🧠 Contexte important pour Cursor

- Le **texte de chaque section sera fourni plus tard** — prévoir des constantes/variables clairement nommées en haut de chaque fichier pour les insérer facilement sans toucher au reste du code
- Les **modèles 3D (.glb)** seront placés dans le dossier `docs/models/` — le code doit aller les chercher là, avec un fallback propre si un fichier est absent (afficher une sphère Three.js basique à la place)
- Le site sera hébergé sur **GitHub Pages** — tous les chemins doivent être **relatifs**, jamais absolus
- Priorité : **performance navigateur** — le site doit tourner à 60fps sur un laptop de lycéen

---

## 🗂️ Structure des fichiers à créer

```
/
├── index.html
├── style.css
├── main.js
│
├── src/
│   ├── scene.js           ← init Three.js, renderer, caméra, lumières
│   ├── stars.js           ← champ d'étoiles procédural (Points + BufferGeometry)
│   ├── loader.js          ← GLTFLoader avec fallback sphère si modèle absent
│   ├── scroll.js          ← GSAP ScrollTrigger, timeline de la caméra
│   ├── sections.js        ← définition des 4 zones (positions, étapes, textes)
│   └── postfx.js          ← EffectComposer, Bloom, Vignette
│
├── docs/
│   └── models/            ← dossier où l'utilisateur déposera ses .glb
│       ├── terre_sphere.glb       (à placer par l'utilisateur)
│       ├── terre_aplatie.glb      (à placer par l'utilisateur)
│       └── README.md              ← expliquer quels fichiers déposer ici
│
└── README.md
```

---

## 🎬 Concept de navigation

**Une scène 3D continue**. Pas d'onglets, pas de pages. La caméra **voyage** dans l'espace au scroll.

| Section | Titre | Mouvement caméra | Modèle |
|---|---|---|---|
| 1 | Introduction | Vue lointaine, Terre au centre | `terre_sphere.glb` |
| 2 | La Terre n'est pas ronde | Descente lente, rotation autour d'un modèle aplati | `terre_aplatie.glb` |
| 3 | La Terre est ronde | Orbite rapprochée, lumière latérale | `terre_sphere.glb` |
| 4 | Conclusion | Recul progressif, Terre qui s'éloigne | `terre_sphere.glb` |

---

## 📝 Gestion du texte (IMPORTANT)

Le texte de chaque section **sera fourni plus tard**. Cursor doit :

1. Créer un fichier `src/content.js` qui centralise **tout** le texte du site
2. Chaque section a : `titre`, `sousTitre`, `paragraphes[]`, `credit` (optionnel)
3. Le reste du code importe depuis `content.js` — **aucun texte hardcodé ailleurs**

### Exemple de structure `content.js`

```js
export const CONTENT = {
  intro: {
    titre: "TITRE À COMPLÉTER",
    sousTitre: "Sous-titre à compléter",
    paragraphes: [
      "Paragraphe 1 à compléter.",
      "Paragraphe 2 à compléter."
    ]
  },
  nonRonde: {
    titre: "TITRE À COMPLÉTER",
    sousTitre: "Sous-titre à compléter",
    paragraphes: [
      "Paragraphe 1 à compléter."
    ]
  },
  ronde: {
    titre: "TITRE À COMPLÉTER",
    sousTitre: "Sous-titre à compléter",
    paragraphes: [
      "Paragraphe 1 à compléter."
    ]
  },
  conclusion: {
    titre: "TITRE À COMPLÉTER",
    sousTitre: "Sous-titre à compléter",
    paragraphes: [
      "Paragraphe 1 à compléter."
    ]
  }
}
```

---

## ⚙️ Stack technique

| Composant | Librairie | Version |
|---|---|---|
| Rendu 3D | Three.js | r160 |
| Animations | GSAP | 3.x |
| Scroll | GSAP ScrollTrigger | 3.x |
| Loader modèles | Three.js GLTFLoader | intégré |
| Post-processing | Three.js EffectComposer | intégré |
| Effets | UnrealBloomPass, VignetteShader | intégré |
| Chargement | importmap ou CDN jsDelivr | — |

---

## 🎨 Direction artistique

### Ambiance
- **Fond** : espace profond — noir absolu `#000005`
- **Étoiles** : 8 000 particules procédurales, tailles et opacités variées
- **Nébuleuse** : gradient radial subtil en arrière-plan CSS (bleu nuit / violet profond)
- **Lumière principale** : `DirectionalLight` simulant le Soleil (blanc chaud `#fff5e0`, intensité 2.5)
- **Lumière ambiante** : très faible (`#0a0a20`, intensité 0.15)

### Typographie
- Titres : `'Cormorant Garamond'` — élégant, astronomique, inhabituel
- Corps : `'DM Sans'` — lisible, propre
- Chargées via Google Fonts

### Effets visuels
| Effet | Paramètres |
|---|---|
| Bloom | threshold 0.2, strength 1.4, radius 0.8 |
| Vignette | offset 0.5, darkness 0.7 |
| Parallaxe étoiles | mouvement souris ÷ 80, lerp 0.05 |
| Rotation modèle | `y += 0.0015` par frame |
| Transition caméra | GSAP `duration: 2.5, ease: "power3.inOut"` |
| Texte overlay | `opacity 0→1`, `translateY 20px→0`, `duration: 0.8s` |

---

## 📐 Étapes de scroll — Timeline

Chaque section occupe **100vh** de scroll. La caméra est animée entre les keyframes.

```js
// Exemple de keyframe dans sections.js
export const KEYFRAMES = [
  // ─── SECTION 1 — Introduction ───────────────────────
  {
    scrollStart: 0,
    camera: { x: 0, y: 2, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "intro"
  },

  // ─── SECTION 2 — Non ronde ──────────────────────────
  {
    scrollStart: 1,
    camera: { x: 3, y: -1, z: 7 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "docs/models/terre_aplatie.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.6,
    textSection: "nonRonde"
  },

  // ─── SECTION 3 — Ronde ──────────────────────────────
  {
    scrollStart: 2,
    camera: { x: -4, y: 1, z: 6 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "ronde"
  },

  // ─── SECTION 4 — Conclusion ─────────────────────────
  {
    scrollStart: 3,
    camera: { x: 0, y: 3, z: 18 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.0,
    textSection: "conclusion"
  }
]
```

---

## 🔁 Fallback modèle absent

Si un `.glb` est introuvable dans `docs/models/`, loader.js doit :

```js
// fallback automatique
const fallbackGeo = new THREE.SphereGeometry(1.5, 64, 64)
const fallbackMat = new THREE.MeshStandardMaterial({
  color: 0x1a4fa0,
  roughness: 0.6,
  metalness: 0.2,
  wireframe: false
})
return new THREE.Mesh(fallbackGeo, fallbackMat)
```

---

## 🧭 Navigation UI

- **Indicateur de section** : 4 points verticaux à droite de l'écran (style Webflow / Awwwards)
- **Flèche scroll** : animation bounce en bas de l'écran sur la section 1
- **Barre de progression** : fine ligne horizontale en haut, qui avance au scroll
- **Nom de la section** : affiché en petit en bas à gauche, change à chaque transition

---

## ♿ Accessibilité & performance

- `prefers-reduced-motion` : désactiver animations si l'utilisateur le demande
- Lazy-load des modèles : charger seulement le modèle de la section active + la suivante
- Canvas `antialias: true`, `powerPreference: "high-performance"`
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — pas plus de 2x

---

## 🚀 GitHub Pages

- Tous les imports de fichiers : **chemins relatifs** (`./docs/models/...`)
- Le `index.html` doit être à la **racine** du repo
- Pas de build step — tout doit tourner en **vanilla JS avec importmap ou CDN**
- Tester avec `npx serve .` en local avant de pousser

---

## 📋 TODO Cursor — dans l'ordre

1. [ ] Créer `index.html` avec canvas fullscreen + overlay HTML
2. [ ] Créer `style.css` — fond noir, overlay texte, UI navigation
3. [ ] Créer `src/scene.js` — init renderer, caméra perspective, lumières
4. [ ] Créer `src/stars.js` — 8000 étoiles procédurales + parallaxe souris
5. [ ] Créer `src/loader.js` — GLTFLoader + fallback sphère
6. [ ] Créer `src/sections.js` — keyframes de la timeline
7. [ ] Créer `src/scroll.js` — GSAP ScrollTrigger + animation caméra
8. [ ] Créer `src/postfx.js` — EffectComposer, Bloom, Vignette
9. [ ] Créer `src/content.js` — tout le texte, vide, prêt à remplir
10. [ ] Créer `docs/models/README.md` — instructions pour déposer les .glb
11. [ ] Tester fallback + modèles + scroll
12. [ ] Optimiser pour 60fps

---

*Brief v3 — optimisé Cursor — 11 mai 2026*
