/**
 * Chaque étape : choix dans `media` :
 * - `{ type: "image", file: "01.jpg" }` → image fixe jusqu’au prochain swipe.
 * - `{ type: "video", file: "02.mp4" }` → vidéo qui joue sur cette étape (ne repart pas de 0 tant que le fichier ne change pas).
 * - `loop: true` → la vidéo boucle tant que tu ne swipes pas.
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
 *   restartOnReenter?: boolean
 * }} MediaSpec
 */

/** @typedef {{ scrollIndex: number, textSection: string, media: MediaSpec }} SectionKeyframe */

/**
 * Défaut : 10 vidéos. Remplace une ligne par `{ type: "image", file: "intro.png" }` pour une diapo fixe.
 * @type {SectionKeyframe[]}
 */
export const KEYFRAMES = [
  { scrollIndex: 0, textSection: "step01", media: { type: "video", file: "01.mp4" } },
  {
    scrollIndex: 1,
    textSection: "step02",
    media: {
      type: "video",
      path: "videos/terre_aplatie/vidéo terre_plate.mp4",
      loop: true
    }
  },
  { scrollIndex: 2, textSection: "step03", media: { type: "video", file: "03.mp4" } },
  { scrollIndex: 3, textSection: "step04", media: { type: "video", file: "04.mp4" } },
  { scrollIndex: 4, textSection: "step05", media: { type: "video", file: "05.mp4" } },
  { scrollIndex: 5, textSection: "step06", media: { type: "video", file: "06.mp4" } },
  { scrollIndex: 6, textSection: "step07", media: { type: "video", file: "07.mp4" } },
  { scrollIndex: 7, textSection: "step08", media: { type: "video", file: "08.mp4" } },
  { scrollIndex: 8, textSection: "step09", media: { type: "video", file: "09.mp4" } },
  { scrollIndex: 9, textSection: "step10", media: { type: "video", file: "10.mp4" } }
]

export function keyframeToSlideMedia(kf) {
  const m = kf.media
  const rel = m.path ?? (m.file ? `media/${m.file}` : "")
  return {
    type: m.type,
    url: rel ? docsUrl(rel) : "",
    loop: m.loop,
    restartOnReenter: m.restartOnReenter
  }
}

export const SECTION_COUNT = KEYFRAMES.length
