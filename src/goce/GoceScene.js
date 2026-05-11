import { GOCE } from "../part2/constants.js"

const R = 1

/**
 * Terre simplifiée + satellite factice + trajectoire d’orbite (GOCE).
 * Si vous ajoutez docs/models/goce.glb, branchez-le ici à la place du mesh primitif.
 */
export function createGoceScene(THREE) {
  const group = new THREE.Group()
  group.name = "GoceScene"

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0x2a4d78,
      roughness: 0.55,
      metalness: 0.12,
      emissive: 0x020810,
      emissiveIntensity: 0.35
    })
  )
  earth.receiveShadow = true
  group.add(earth)

  /* Halo type atmosphère (Fresnel simplifié : sphère légèrement plus grande, face caméra plus visible via opacity) */
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.04, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false
    })
  )
  group.add(atmo)

  /* Carte gravité factice : sphère légèrement au-dessus avec dégradé (placeholder sans texture externe) */
  const gravCanvas = document.createElement("canvas")
  gravCanvas.width = 256
  gravCanvas.height = 128
  const gctx = gravCanvas.getContext("2d")
  const grd = gctx.createLinearGradient(0, 0, 256, 128)
  grd.addColorStop(0, "#00c896")
  grd.addColorStop(0.5, "#1a1a30")
  grd.addColorStop(1, "#ff3355")
  gctx.fillStyle = grd
  gctx.fillRect(0, 0, 256, 128)
  const gravTex = new THREE.CanvasTexture(gravCanvas)
  gravTex.colorSpace = THREE.SRGBColorSpace
  const gravityShell = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.01, 48, 48),
    new THREE.MeshStandardMaterial({
      map: gravTex,
      transparent: true,
      opacity: 0,
      roughness: 1,
      metalness: 0,
      depthWrite: false
    })
  )
  group.add(gravityShell)

  /* Géoïde : même sphère avec léger noise en vertex (sans heightmap externe) */
  const geoidGeo = new THREE.SphereGeometry(R * 1.002, 64, 64)
  const pos = geoidGeo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    const jitter = Math.sin(n.x * 9 + n.y * 11) * Math.cos(n.z * 7) * 0.012
    v.addScaledVector(n, jitter)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geoidGeo.computeVertexNormals()
  const geoidMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.45,
    metalness: 0.2,
    transparent: true,
    opacity: 0
  })
  const geoid = new THREE.Mesh(geoidGeo, geoidMat)
  group.add(geoid)

  const orbitRadius = R * ((6371 + GOCE.altitudeKm) / 6371)
  const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, Math.PI * 2, false, 0)
  const orbitPts = orbitCurve.getPoints(120).map((p) => new THREE.Vector3(p.x, 0, p.y))
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts)
  const orbitLine = new THREE.Line(
    orbitGeo,
    new THREE.LineBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.35 })
  )
  const orbitGroup = new THREE.Group()
  orbitGroup.rotation.x = THREE.MathUtils.degToRad(90 - GOCE.orbitInclinationDegrees * 0.25)
  orbitGroup.add(orbitLine)
  group.add(orbitGroup)

  const sat = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xccddee, metalness: 0.6, roughness: 0.35 })
  )
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.4, roughness: 0.5 })
  const wingGeo = new THREE.BoxGeometry(0.22, 0.01, 0.08)
  const wingL = new THREE.Mesh(wingGeo, wingMat)
  wingL.position.x = -0.12
  const wingR = new THREE.Mesh(wingGeo, wingMat)
  wingR.position.x = 0.12
  sat.add(body, wingL, wingR)
  sat.scale.setScalar(0.85)
  sat.visible = false
  group.add(sat)

  let orbitAngle = 0

  function placeSatellite(angle) {
    orbitAngle = angle
    const x = Math.cos(angle) * orbitRadius
    const z = Math.sin(angle) * orbitRadius
    const y = Math.sin(angle * 0.5) * orbitRadius * 0.08
    sat.position.set(x, y, z)
    const nextA = angle + 0.15
    const nx = Math.cos(nextA) * orbitRadius
    const nz = Math.sin(nextA) * orbitRadius
    const ny = Math.sin(nextA * 0.5) * orbitRadius * 0.08
    sat.lookAt(new THREE.Vector3(nx, ny, nz))
  }

  /**
   * @param {object} v — gravité 0-1, géoïde 0-1, satVisible 0-1, atmo 0-1
   */
  function updateVisuals(v) {
    gravityShell.material.opacity = v.gravity * 0.85
    geoidMat.opacity = v.geoid
    sat.visible = v.satellite > 0.01
    atmo.material.opacity = 0.08 + v.atmosphere * 0.12
    orbitLine.material.opacity = 0.08 + v.orbit * 0.45
  }

  function dispose() {
    earth.geometry.dispose()
    earth.material.dispose()
    atmo.geometry.dispose()
    atmo.material.dispose()
    gravTex.dispose()
    gravityShell.geometry.dispose()
    gravityShell.material.dispose()
    geoidGeo.dispose()
    geoidMat.dispose()
    orbitGeo.dispose()
    orbitLine.material.dispose()
    body.geometry.dispose()
    body.material.dispose()
    wingGeo.dispose()
    wingMat.dispose()
  }

  return {
    group,
    placeSatellite,
    updateVisuals,
    dispose,
    orbitRadius,
    earth,
    gravityShell,
    geoid,
    sat,
    atmo
  }
}
