/**
 * Chaque étape : soit `media` (un seul visuel), soit `tiles` (tableau de `MediaSpec`, ex. 3 vignettes).
 * Avec `media` :
 * - `{ type: "image", file: "01.jpg" }` → image fixe jusqu’au prochain swipe.
 * - `{ type: "video", file: "02.mp4" }` → vidéo qui joue sur cette étape (ne repart pas de 0 tant que le fichier ne change pas).
 * - `loop: true` → la vidéo boucle tant que tu ne swipes pas.
 * - `loopSkipTailSec` (ex. `1/30` à 30 ips) → reboucle un peu avant la fin pour éviter la saccade si la dernière image ne colle pas au début.
 * - `restartOnReenter: true` → en revenant sur l’étape avec le même fichier, la vidéo repart du début.
 * - `sphereTwoStep: true` → 1er swipe = sphère figée, 2e = aplatissement (`docs/prompts/sphère aplatie.html` ; anciennes variantes canvas : `sphereAnim.js`, `sphereAnimPage3Stylish.js`).
 * - `puitsPrompt: true` → iframe `docs/prompts/puits-animation.html` plein cadre (étape « Première partie »), sans `loading="lazy"`.
 * - `topoPrompt: true` → iframe `docs/prompts/topographie-animation.html` plein cadre (étape 5), sans `loading="lazy"`.
 * - `gravitySpherePrompt: true` → iframe `docs/prompts/gravity-sphere-formation.html` (gravité → sphère), étape 4.
 * - `conclusionPrompt: true` → iframe `docs/prompts/conclusion-animation.html` (étape 6).
 * - `epilogue: true` → remerciements après la conclusion (hors sommaire / pastilles).
 *
 * Fichiers :
 * - `file` → `docs/media/<file>` (ex. `01.mp4`)
 * - `path` → `docs/<path>` si tu veux un autre dossier (prioritaire sur `file`)
 */

function docsUrl(relativePathUnderDocs) {
  const p = String(relativePathUnderDocs).replace(/^\/+/, "")
  return new URL(`../docs/${p}`, import.meta.url).href
}

/**
 * @typedef {{
 *   type: "image" | "video",
 *   file?: string,
 *   path?: string,
 *   loop?: boolean,
 *   loopSkipTailSec?: number,
 *   restartOnReenter?: boolean
 * }} MediaSpec
 */

/**
 * @typedef {{ scrollIndex: number, textSection: string, media?: MediaSpec, tiles?: MediaSpec[], sphereTwoStep?: boolean, eratoTwoStep?: boolean, puitsPrompt?: boolean, topoPrompt?: boolean, gravitySpherePrompt?: boolean, conclusionPrompt?: boolean, epilogue?: boolean }} SectionKeyframe
 */

/**
 * Fond neutre tant qu’il n’y a pas de vrai média dans `docs/media/` (évite les 404 sur 01.mp4…).
 * Remplace par ex. `{ type: "video", file: "01.mp4" }` quand le fichier est ajouté.
 */
const PLACEHOLDER = { type: "image", file: "placeholder.svg" }

/**
 * Étape 1 : image d’intro (docs/media/intro-terre-plate.png) + texte à gauche.
 * @type {SectionKeyframe[]}
 */
export const KEYFRAMES = [
  {
    scrollIndex: 0,
    textSection: "step01",
    media: { type: "image", file: "intro-terre-plate.png" }
  },
  /* Étape 2 : iframe puits (clic dans l’iframe pour lancer l’animation) */
  { scrollIndex: 1, textSection: "step02", puitsPrompt: true },
  /* Étape 3 : même panneau — 1er swipe = sphère figée, 2e = animation (voir scroll.js sphereSubStep) */
  { scrollIndex: 2, textSection: "step03", sphereTwoStep: true },
  /* Étape 4 : animation gravité / formation sphérique (gravity-sphere-formation.html) */
  { scrollIndex: 3, textSection: "step04", gravitySpherePrompt: true },
  /* Étape 5 : iframe topographie */
  { scrollIndex: 4, textSection: "step05", topoPrompt: true },
  { scrollIndex: 5, textSection: "step06", conclusionPrompt: true },
  { scrollIndex: 6, textSection: "step07", epilogue: true },
]

/** @param {SectionKeyframe | undefined} kf */
export function isEpilogueKeyframe(kf) {
  return !!kf?.epilogue
}

export const NAV_SECTION_COUNT = KEYFRAMES.filter((k) => !isEpilogueKeyframe(k)).length

/** Index dans la barre de progression / pastilles (l’épilogue reste à 100 %). */
export function keyframeToNavIndex(keyframeIndex) {
  const kf = KEYFRAMES[keyframeIndex]
  if (!kf) return 0
  if (isEpilogueKeyframe(kf)) return Math.max(0, NAV_SECTION_COUNT - 1)
  let n = 0
  for (let i = 0; i < keyframeIndex; i++) {
    if (!isEpilogueKeyframe(KEYFRAMES[i])) n++
  }
  return n
}

export function mediaSpecToSlideMedia(m) {
  const rel = m.path ?? (m.file ? `media/${m.file}` : "")
  return {
    type: m.type,
    url: rel ? docsUrl(rel) : "",
    loop: m.loop,
    loopSkipTailSec: m.loopSkipTailSec,
    restartOnReenter: m.restartOnReenter
  }
}

export function keyframeToSlideMedia(kf) {
  return mediaSpecToSlideMedia(kf.media ?? PLACEHOLDER)
}

export const SECTION_COUNT = KEYFRAMES.length
