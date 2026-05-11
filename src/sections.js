/**
 * Chemins des modèles 3D (chemins relatifs — GitHub Pages).
 *
 * Partie 1 (intro, premier panneau) : deux GLB Meshy — bascule au scroll dans scroll.js.
 * Partie 2 et suivantes : Earth 2K (.obj + .mtl dans le même dossier).
 */

export const MODEL_PARTIE1_CONE =
  "./docs/models/Meshy_AI_Earth_on_a_Cone_0511114642_texture.glb"

export const MODEL_PARTIE1_EDGE =
  "./docs/models/Meshy_AI_Edge_of_the_World_0511114634_texture.glb"

export const MODEL_EARTH_2K = "./docs/models/Earth 2K.obj"

/** Tous les fichiers à précharger au démarrage */
export const ALL_MODEL_URLS = [MODEL_PARTIE1_CONE, MODEL_PARTIE1_EDGE, MODEL_EARTH_2K]

/**
 * Keyframes de la timeline scroll — positions caméra / cible / modèle.
 * Les modelFile servent au préchargement et aux segments autres que l’étape 0 (deux modèles).
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
    modelFile: MODEL_EARTH_2K,
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
