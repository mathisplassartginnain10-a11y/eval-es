import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

const modelCache = new Map()

function createFallbackMesh(THREE) {
  const fallbackGeo = new THREE.SphereGeometry(1.5, 64, 64)
  const fallbackMat = new THREE.MeshStandardMaterial({
    color: 0x1a4fa0,
    roughness: 0.6,
    metalness: 0.2,
    wireframe: false
  })
  const mesh = new THREE.Mesh(fallbackGeo, fallbackMat)
  mesh.name = "FallbackEarth"
  return mesh
}

/**
 * Charge un GLB depuis un chemin relatif ; sphère de secours si absent ou erreur.
 */
export async function loadEarthModel(THREE, url) {
  if (modelCache.has(url)) {
    return modelCache.get(url).clone(true)
  }

  const loader = new GLTFLoader()

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0]
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material && child.material.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace
            }
          }
        })
        modelCache.set(url, root)
        resolve(root.clone(true))
      },
      undefined,
      () => {
        resolve(createFallbackMesh(THREE))
      }
    )
  })
}

/**
 * Précharge les modèles pour les index de sections données (sans doublons d'URL).
 */
export async function preloadForSections(THREE, keyframes, indices) {
  const urls = new Set()
  for (const i of indices) {
    const k = keyframes[i]
    if (k) urls.add(k.modelFile)
  }
  await Promise.all([...urls].map((u) => loadEarthModel(THREE, u)))
}
