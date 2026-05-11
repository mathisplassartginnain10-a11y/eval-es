import * as THREE from "three"

const STAR_COUNT = 8000

/**
 * Champ d'étoiles procédural + état parallaxe (mise à jour dans la boucle).
 * @param {{ reduced: boolean }} motionRef — mis à jour si l’utilisateur change « réduire les animations ».
 */
export function createStarField(scene, THREE, motionRef) {
  const reduced = motionRef.reduced === true

  const count = reduced ? 2000 : STAR_COUNT
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  const rng = (a, b) => a + Math.random() * (b - a)

  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    sizes[i] = rng(0.4, 2.2)
    opacities[i] = rng(0.15, 0.95)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1))

  const mat = new THREE.ShaderMaterial({
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    vertexShader: `
      uniform float uPixelRatio;
      attribute float aSize;
      attribute float aOpacity;
      varying float vOpacity;
      void main() {
        vOpacity = aOpacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (220.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vOpacity;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
        gl_FragColor = vec4(0.92, 0.95, 1.0, alpha);
      }
    `
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
    mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
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
      geo.dispose()
      mat.dispose()
      scene.remove(points)
    }
  }
}
