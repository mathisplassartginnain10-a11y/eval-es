import * as THREE from "three"

/**
 * Initialise la scène Three.js : renderer, caméra, lumières.
 */
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  })
  renderer.setClearColor(0x000005, 1)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.45

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 2, 10)

  const sun = new THREE.DirectionalLight(0xfff5e0, 3.2)
  sun.position.set(8, 5, 6)
  scene.add(sun)

  const hemi = new THREE.HemisphereLight(0x6a7ab0, 0x080810, 0.55)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight(0x2a2a40, 0.5)
  scene.add(ambient)

  const earthHolder = new THREE.Group()
  scene.add(earthHolder)

  function onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  return {
    THREE,
    scene,
    camera,
    renderer,
    earthHolder,
    sun,
    onResize
  }
}
