import * as THREE from "three"

// === [FORCE CLEAR 3D RECT - RUNTIME] ===
if (typeof THREE !== "undefined" && THREE.WebGLRenderer) {
  const oldRenderer = THREE.WebGLRenderer
  THREE.WebGLRenderer = function (...args) {
    const renderer = new oldRenderer(...args)
    const el = renderer.domElement
    el.style.border = "none"
    el.style.outline = "none"
    el.style.background = "transparent"
    el.style.margin = "0"
    el.style.padding = "0"
    el.style.display = "block"
    el.style.position = "relative"
    el.style.boxShadow = "none"
    el.style.borderRadius = "0"
    el.style.overflow = "visible"
    el.style.webkitTapHighlightColor = "transparent"
    el.style.webkitAppearance = "none"
    return renderer
  }
  THREE.WebGLRenderer.prototype = oldRenderer.prototype
}

function init() {
  const wrap = document.getElementById("model-area")
  const container = document.getElementById("three-container")
  if (!wrap || !container) return

  const w = container.clientWidth || window.innerWidth
  const h = container.clientHeight || Math.min(400, window.innerHeight * 0.5)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.z = 4

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  const dpr0 = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr0)
  renderer.setSize(w, h, false)
  renderer.setClearColor(0x000000, 0)

  const canvas = renderer.domElement
  canvas.id = "canvas3d"
  container.appendChild(canvas)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(2, 3, 4)
  scene.add(dir)

  const geo = new THREE.IcosahedronGeometry(1.1, 2)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6b8cff,
    metalness: 0.2,
    roughness: 0.45,
  })
  scene.add(new THREE.Mesh(geo, mat))

  function resize() {
    const cw = container.clientWidth || window.innerWidth
    const ch = container.clientHeight || 400
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    camera.aspect = cw / Math.max(1, ch)
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(dpr)
    renderer.setSize(cw, ch, false)
  }
  window.addEventListener("resize", resize)
  resize()

  function tick() {
    requestAnimationFrame(tick)
    scene.rotation.y += 0.008
    renderer.render(scene, camera)
  }
  tick()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true })
} else {
  init()
}
