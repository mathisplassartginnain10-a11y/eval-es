/**
 * Chemins des modèles — URLs absolues via import.meta.url (obligatoire sur GitHub Pages
 * quand l’URL est /eval-es sans slash final : ./docs/... ne doit pas devenir /docs/...).
 */

function modelUrl(relativeFromSrc) {
  return new URL(relativeFromSrc, import.meta.url).href
}

export const MODEL_PARTIE1_CONE = modelUrl("../docs/models/Meshy_AI_Earth_on_a_Cone_0511114642_texture.glb")

export const MODEL_PARTIE1_EDGE = modelUrl("../docs/models/Meshy_AI_Edge_of_the_World_0511114634_texture.glb")

export const MODEL_EARTH_2K = modelUrl("../docs/models/Earth 2K.obj")

/** Tous les fichiers à précharger au démarrage */
export const ALL_MODEL_URLS = [MODEL_PARTIE1_CONE, MODEL_PARTIE1_EDGE, MODEL_EARTH_2K]

/**
 * Keyframes de la timeline scroll — positions caméra / cible / modèle.
 */
export const KEYFRAMES = [
  {
    scrollStart: 0,
    camera: { x: 0, y: 2, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: MODEL_PARTIE1_CONE,
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "intro"
  },
  {
    scrollStart: 1,
    camera: { x: 3, y: -1, z: 7 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: MODEL_PARTIE1_EDGE,
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.6,
    textSection: "nonRonde"
  },
  {
    scrollStart: 2,
    camera: { x: -4, y: 1, z: 6 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: MODEL_EARTH_2K,
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "ronde"
  },
  {
    scrollStart: 3,
    camera: { x: 0, y: 3, z: 18 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: MODEL_EARTH_2K,
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.0,
    textSection: "conclusion"
  }
]

export const SECTION_COUNT = KEYFRAMES.length
