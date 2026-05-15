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
 * @typedef {{ scrollIndex: number, textSection: string, media?: MediaSpec, tiles?: MediaSpec[], sphereTwoStep?: boolean, eratoTwoStep?: boolean, puitsPrompt?: boolean, topoPrompt?: boolean, gravitySpherePrompt?: boolean }} SectionKeyframe
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
  { scrollIndex: 5, textSection: "step06", media: PLACEHOLDER }
]

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
