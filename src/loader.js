import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"
import { MTLLoader } from "three/addons/loaders/MTLLoader.js"

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

function normalizeTreeMaterials(root, THREE) {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false
      child.receiveShadow = false
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const m of mats) {
        if (!m) continue
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
        if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace
        if (m.bumpMap) m.bumpMap.colorSpace = THREE.LinearSRGBColorSpace
        if (m.transparent) m.depthWrite = false
      }
    }
  })
}

function splitDirAndFile(url) {
  const clean = url.split("?")[0]
  const i = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"))
  if (i < 0) return { dir: "./", file: clean }
  return { dir: clean.slice(0, i + 1), file: clean.slice(i + 1) }
}

/**
 * Charge un .obj + .mtl (même dossier, même nom de base).
 */
function loadObjWithMtl(THREE, url) {
  const { dir, file } = splitDirAndFile(url)
  if (!/\.obj$/i.test(file)) {
    return Promise.resolve(createFallbackMesh(THREE))
  }
  const mtlFile = file.replace(/\.obj$/i, ".mtl")

  return new Promise((resolve) => {
    const mtlLoader = new MTLLoader()
    mtlLoader.setPath(dir)
    mtlLoader.load(
      mtlFile,
      (materials) => {
        materials.preload()
        const objLoader = new OBJLoader()
        objLoader.setMaterials(materials)
        objLoader.setPath(dir)
        objLoader.load(
          file,
          (group) => {
            normalizeTreeMaterials(group, THREE)
            modelCache.set(url, group)
            resolve(group.clone(true))
          },
          undefined,
          () => resolve(createFallbackMesh(THREE))
        )
      },
      undefined,
      () => {
        const objLoader = new OBJLoader()
        objLoader.setPath(dir)
        objLoader.load(
          file,
          (group) => {
            normalizeTreeMaterials(group, THREE)
            modelCache.set(url, group)
            resolve(group.clone(true))
          },
          undefined,
          () => resolve(createFallbackMesh(THREE))
        )
      }
    )
  })
}

/**
 * Charge un GLB/GLTF ou un OBJ+MTL ; sphère de secours si absent ou erreur.
 */
export async function loadEarthModel(THREE, url) {
  if (modelCache.has(url)) {
    return modelCache.get(url).clone(true)
  }

  const pathLower = url.split("?")[0].toLowerCase()
  if (pathLower.endsWith(".obj")) {
    return loadObjWithMtl(THREE, url)
  }

  const loader = new GLTFLoader()

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0]
        normalizeTreeMaterials(root, THREE)
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
 * Précharge les modèles listés dans keyframes pour les index donnés.
 */
export async function preloadForSections(THREE, keyframes, indices) {
  const urls = new Set()
  for (const i of indices) {
    const k = keyframes[i]
    if (k) urls.add(k.modelFile)
  }
  await Promise.all([...urls].map((u) => loadEarthModel(THREE, u)))
}

/**
 * Précharge une liste explicite d’URLs (tous les modèles du projet).
 */
export async function preloadUrls(THREE, urls) {
  await Promise.all([...new Set(urls)].map((u) => loadEarthModel(THREE, u)))
}
