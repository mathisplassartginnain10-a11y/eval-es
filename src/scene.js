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
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 2, 10)

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.5)
  sun.position.set(8, 5, 6)
  scene.add(sun)

  const ambient = new THREE.AmbientLight(0x0a0a20, 0.15)
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
