/**
 * Chaque étape : choix dans `media` :
 * - `{ type: "image", file: "01.jpg" }` → image fixe jusqu’au prochain swipe.
 * - `{ type: "video", file: "02.mp4" }` → vidéo qui joue sur cette étape (ne repart pas de 0 tant que le fichier ne change pas).
 * - `loop: true` → la vidéo boucle tant que tu ne swipes pas.
 * - `loopSkipTailSec` (ex. `1/30` à 30 ips) → reboucle un peu avant la fin pour éviter la saccade si la dernière image ne colle pas au début.
 * - `restartOnReenter: true` → en revenant sur l’étape avec le même fichier, la vidéo repart du début.
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

/** @typedef {{ scrollIndex: number, textSection: string, media: MediaSpec }} SectionKeyframe */

/**
 * Fond neutre tant qu’il n’y a pas de vrai média dans `docs/media/` (évite les 404 sur 01.mp4…).
 * Remplace par ex. `{ type: "video", file: "01.mp4" }` quand le fichier est ajouté.
 */
const PLACEHOLDER = { type: "image", file: "placeholder.svg" }

/**
 * Défaut : étape 2 = vidéo Terre aplatie ; autres étapes = placeholder jusqu’à ajout des fichiers.
 * @type {SectionKeyframe[]}
 */
export const KEYFRAMES = [
  { scrollIndex: 0, textSection: "step01", media: PLACEHOLDER },
  // 2ᵉ page (Étape 2) — docs/videos/terre_aplatie/vidéo terre_aplatie.mp4
  {
    scrollIndex: 1,
    textSection: "step02",
    media: {
      type: "video",
      path: "videos/terre_aplatie/vidéo terre_aplatie.mp4",
      loop: true,
      // 30 ips : ~1 image en moins en fin de fichier = jointure plus propre ; augmente à 2/30 si besoin
      loopSkipTailSec: 1 / 30
    }
  },
  { scrollIndex: 2, textSection: "step03", media: PLACEHOLDER },
  { scrollIndex: 3, textSection: "step04", media: PLACEHOLDER },
  { scrollIndex: 4, textSection: "step05", media: PLACEHOLDER },
  { scrollIndex: 5, textSection: "step06", media: PLACEHOLDER },
  { scrollIndex: 6, textSection: "step07", media: PLACEHOLDER },
  { scrollIndex: 7, textSection: "step08", media: PLACEHOLDER },
  { scrollIndex: 8, textSection: "step09", media: PLACEHOLDER },
  { scrollIndex: 9, textSection: "step10", media: PLACEHOLDER }
]

export function keyframeToSlideMedia(kf) {
  const m = kf.media
  const rel = m.path ?? (m.file ? `media/${m.file}` : "")
  return {
    type: m.type,
    url: rel ? docsUrl(rel) : "",
    loop: m.loop,
    loopSkipTailSec: m.loopSkipTailSec,
    restartOnReenter: m.restartOnReenter
  }
}

export const SECTION_COUNT = KEYFRAMES.length
