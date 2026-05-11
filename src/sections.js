/**
 * Keyframes de la timeline scroll — positions caméra / cible / modèle.
 */

export const KEYFRAMES = [
  {
    scrollStart: 0,
    camera: { x: 0, y: 2, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "./docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "intro"
  },
  {
    scrollStart: 1,
    camera: { x: 3, y: -1, z: 7 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "./docs/models/terre_aplatie.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.6,
    textSection: "nonRonde"
  },
  {
    scrollStart: 2,
    camera: { x: -4, y: 1, z: 6 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "./docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.4,
    textSection: "ronde"
  },
  {
    scrollStart: 3,
    camera: { x: 0, y: 3, z: 18 },
    target: { x: 0, y: 0, z: 0 },
    modelFile: "./docs/models/terre_sphere.glb",
    modelPos: { x: 0, y: 0, z: 0 },
    modelScale: 1.0,
    textSection: "conclusion"
  }
]

export const SECTION_COUNT = KEYFRAMES.length
