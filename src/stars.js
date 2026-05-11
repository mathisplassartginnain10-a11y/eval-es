import * as THREE from "three"

const STAR_COUNT = 8000

/** Texture douce pour les points (pas de ShaderMaterial custom = pas d’erreurs WebGL en rafale). */
function createStarSpriteTexture() {
  const s = 64
  const c = document.createElement("canvas")
  c.width = s
  c.height = s
  const ctx = c.getContext("2d")
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, "rgba(255, 255, 255, 1)")
  g.addColorStop(0.35, "rgba(255, 255, 255, 0.4)")
  g.addColorStop(1, "rgba(255, 255, 255, 0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Champ d'étoiles procédural + parallaxe souris.
 * @param {{ reduced: boolean }} motionRef
 */
export function createStarField(scene, THREE, motionRef) {
  const reduced = motionRef.reduced === true
  const count = reduced ? 2000 : STAR_COUNT
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const rng = (a, b) => a + Math.random() * (b - a)

  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    const tw = 0.75 + Math.random() * 0.25
    colors[i * 3] = 0.92 * tw
    colors[i * 3 + 1] = 0.95 * tw
    colors[i * 3 + 2] = 1.0 * tw
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  const map = createStarSpriteTexture()
  const baseSize = reduced ? 0.06 : 0.085

  const mat = new THREE.PointsMaterial({
    size: baseSize * Math.min(window.devicePixelRatio, 2),
    sizeAttenuation: true,
    map,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  })

  const points = new THREE.Points(geo, mat)
  scene.add(points)

  const parallax = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    lerp: reduced ? 1 : 0.05
  }

  function onMouseMove(e) {
    if (motionRef.reduced) return
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1
    parallax.targetX = nx / 80
    parallax.targetY = -ny / 80
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true })

  function updateOnResize() {
    mat.size = baseSize * Math.min(window.devicePixelRatio, 2)
  }

  function update() {
    const lerpAmt = motionRef.reduced ? 1 : parallax.lerp
    parallax.currentX += (parallax.targetX - parallax.currentX) * lerpAmt
    parallax.currentY += (parallax.targetY - parallax.currentY) * lerpAmt
    points.position.x = parallax.currentX
    points.position.y = parallax.currentY
  }

  return {
    points,
    update,
    updateOnResize,
    dispose() {
      window.removeEventListener("mousemove", onMouseMove)
      map.dispose()
      geo.dispose()
      mat.dispose()
      scene.remove(points)
    }
  }
}
