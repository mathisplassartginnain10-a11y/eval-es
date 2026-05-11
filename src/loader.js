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
  mesh.userData.isFallback = true
  return mesh
}

/** Centre le modèle à l’origine et met sa plus grande dimension ≈ 2×targetRadius (visible avec la caméra actuelle). */
function frameModel(root, THREE, targetRadius = 1.7) {
  if (root.userData?.isFallback) return
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim < 1e-9) return
  const s = (2 * targetRadius) / maxDim
  root.position.sub(center)
  root.scale.setScalar(s)
}

function normalizeTreeMaterials(root, THREE) {
  root.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = false
    child.receiveShadow = false

    const list = Array.isArray(child.material) ? child.material : [child.material]
    const upgraded = list.map((m) => {
      if (!m) return m
      if (m.isMeshPhongMaterial) {
        const std = new THREE.MeshStandardMaterial({
          color: m.color.clone(),
          emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
          emissiveIntensity: typeof m.emissiveIntensity === "number" ? m.emissiveIntensity : 0,
          map: m.map,
          bumpMap: m.bumpMap,
          bumpScale: m.bumpScale ?? 1,
          transparent: m.transparent,
          opacity: m.opacity,
          alphaTest: m.alphaTest,
          side: m.side,
          roughness: m.transparent ? 0.35 : 0.82,
          metalness: 0.04,
          depthWrite: m.transparent ? false : true
        })
        m.dispose()
        return std
      }
      return m
    })
    child.material = upgraded.length === 1 ? upgraded[0] : upgraded

    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const m of mats) {
      if (!m) continue
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
      if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace
      if (m.bumpMap) m.bumpMap.colorSpace = THREE.LinearSRGBColorSpace
      if (m.transparent) m.depthWrite = false
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
            frameModel(group, THREE)
            modelCache.set(url, group)
            resolve(group.clone(true))
          },
          undefined,
          (err) => {
            console.warn("[loader] OBJ", url, err)
            resolve(createFallbackMesh(THREE))
          }
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
            frameModel(group, THREE)
            modelCache.set(url, group)
            resolve(group.clone(true))
          },
          undefined,
          (err) => {
            console.warn("[loader] OBJ (sans MTL)", url, err)
            resolve(createFallbackMesh(THREE))
          }
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
        frameModel(root, THREE)
        modelCache.set(url, root)
        resolve(root.clone(true))
      },
      undefined,
      (err) => {
        console.warn("[loader] GLB/GLTF", url, err)
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
