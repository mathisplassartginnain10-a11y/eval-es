import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"
import { MTLLoader } from "three/addons/loaders/MTLLoader.js"
import { STLLoader } from "three/addons/loaders/STLLoader.js"
import { PLYLoader } from "three/addons/loaders/PLYLoader.js"
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js"
import { VRMLLoader } from "three/addons/loaders/VRMLLoader.js"
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js"
import { PCDLoader } from "three/addons/loaders/PCDLoader.js"

const modelCache = new Map()

/** Même version que l’importmap `index.html` — décodeurs Draco pour GLB/GLTF compressés. */
const DRACO_DECODER_BASE =
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/"

let dracoLoaderSingleton = null
function ensureDracoLoader() {
  if (!dracoLoaderSingleton) {
    dracoLoaderSingleton = new DRACOLoader()
    dracoLoaderSingleton.setDecoderPath(DRACO_DECODER_BASE)
  }
  return dracoLoaderSingleton
}

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

function hasGeometry(root, THREE) {
  root.updateMatrixWorld(true)
  return !new THREE.Box3().setFromObject(root).isEmpty()
}

function splitDirAndFile(url) {
  const clean = url.split("?")[0]
  const i = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"))
  if (i < 0) return { dir: "./", file: clean }
  return { dir: clean.slice(0, i + 1), file: clean.slice(i + 1) }
}

function urlExtension(url) {
  const file = splitDirAndFile(url).file
  const dot = file.lastIndexOf(".")
  if (dot < 0) return ""
  return file.slice(dot + 1).toLowerCase()
}

/**
 * BufferGeometry (STL / PLY) → groupe avec Mesh ou Points.
 */
function bufferGeometryToRoot(THREE, geometry, label) {
  const root = new THREE.Group()
  root.name = label
  const idx = geometry.getIndex()
  const hasFaces = idx !== null && idx.count > 0
  if (hasFaces) {
    if (!geometry.attributes.normal) geometry.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.06,
      vertexColors: !!geometry.attributes.color,
      side: THREE.DoubleSide
    })
    root.add(new THREE.Mesh(geometry, mat))
  } else {
    const mat = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      vertexColors: !!geometry.attributes.color,
      color: geometry.attributes.color ? 0xffffff : 0x88bbff
    })
    root.add(new THREE.Points(geometry, mat))
  }
  return root
}

function finalizeLoadedRoot(THREE, url, root, formatLabel) {
  normalizeTreeMaterials(root, THREE)
  frameModel(root, THREE)
  if (!hasGeometry(root, THREE)) {
    console.warn(`[loader] ${formatLabel} géométrie vide, fallback:`, url)
    return createFallbackMesh(THREE)
  }
  modelCache.set(url, root)
  return root.clone(true)
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
            resolve(finalizeLoadedRoot(THREE, url, group, "OBJ"))
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
            resolve(finalizeLoadedRoot(THREE, url, group, "OBJ (sans MTL)"))
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

function loadWithPathLoader(THREE, url, LoaderClass, formatLabel, onLoaded) {
  const { dir, file } = splitDirAndFile(url)
  const loader = new LoaderClass()
  loader.setPath(dir)
  return new Promise((resolve) => {
    loader.load(
      file,
      (data) => {
        try {
          const root = onLoaded(data)
          resolve(finalizeLoadedRoot(THREE, url, root, formatLabel))
        } catch (e) {
          console.warn(`[loader] ${formatLabel} parse`, url, e)
          resolve(createFallbackMesh(THREE))
        }
      },
      undefined,
      (err) => {
        console.warn(`[loader] ${formatLabel}`, url, err)
        resolve(createFallbackMesh(THREE))
      }
    )
  })
}

function loadFbx(THREE, url) {
  return loadWithPathLoader(THREE, url, FBXLoader, "FBX", (root) => root)
}

function loadStl(THREE, url) {
  return loadWithPathLoader(THREE, url, STLLoader, "STL", (geometry) =>
    bufferGeometryToRoot(THREE, geometry, "STL")
  )
}

function loadPly(THREE, url) {
  return loadWithPathLoader(THREE, url, PLYLoader, "PLY", (geometry) =>
    bufferGeometryToRoot(THREE, geometry, "PLY")
  )
}

function loadCollada(THREE, url) {
  return loadWithPathLoader(THREE, url, ColladaLoader, "Collada", (collada) => collada.scene)
}

function loadVrml(THREE, url) {
  return loadWithPathLoader(THREE, url, VRMLLoader, "VRML", (scene) => scene)
}

function load3mf(THREE, url) {
  return loadWithPathLoader(THREE, url, ThreeMFLoader, "3MF", (group) => group)
}

function loadPcd(THREE, url) {
  return loadWithPathLoader(THREE, url, PCDLoader, "PCD", (points) => {
    const root = new THREE.Group()
    root.name = "PCD"
    root.add(points)
    return root
  })
}

function loadGltf(THREE, url) {
  const { dir, file } = splitDirAndFile(url)
  const loader = new GLTFLoader()
  loader.setPath(dir)
  loader.setDRACOLoader(ensureDracoLoader())

  return new Promise((resolve) => {
    loader.load(
      file,
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0]
        resolve(finalizeLoadedRoot(THREE, url, root, "GLB/GLTF"))
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
 * Charge un fichier 3D selon l’extension : glTF/GLB (Draco si besoin), FBX, OBJ+MTL,
 * STL, PLY, Collada (.dae), VRML (.wrl / .vrml), 3MF, PCD. Défaut : glTF.
 */
export async function loadEarthModel(THREE, url) {
  if (modelCache.has(url)) {
    return modelCache.get(url).clone(true)
  }

  const ext = urlExtension(url)

  switch (ext) {
    case "obj":
      return loadObjWithMtl(THREE, url)
    case "fbx":
      return loadFbx(THREE, url)
    case "stl":
      return loadStl(THREE, url)
    case "ply":
      return loadPly(THREE, url)
    case "dae":
      return loadCollada(THREE, url)
    case "wrl":
    case "vrml":
      return loadVrml(THREE, url)
    case "3mf":
      return load3mf(THREE, url)
    case "pcd":
      return loadPcd(THREE, url)
    case "gltf":
    case "glb":
    default:
      if (ext && !["gltf", "glb"].includes(ext)) {
        console.warn("[loader] extension non reconnue, tentative glTF:", ext, url)
      }
      return loadGltf(THREE, url)
  }
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
