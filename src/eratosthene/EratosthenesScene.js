import { latLonToVector3 } from "../utils/latLonToVector3.js"
import { CITIES, ERATOSTHENES } from "../part2/constants.js"
import { CSS2DObject } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js"

const GLOBE_RADIUS = 1

function vec(THREE, lat, lon) {
  const v = latLonToVector3(lat, lon, GLOBE_RADIUS)
  return new THREE.Vector3(v.x, v.y, v.z)
}

/**
 * Bâton vertical à la surface (normale sortante).
 */
function createStick(THREE, lat, lon, stickHeight = 0.08) {
  const position = vec(THREE, lat, lon)
  const n = position.clone().normalize()
  const geometry = new THREE.CylinderGeometry(0.006, 0.006, stickHeight, 10)
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.65,
    metalness: 0.05,
    transparent: true,
    opacity: 0
  })
  const stick = new THREE.Mesh(geometry, material)
  stick.castShadow = true
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)
  stick.quaternion.copy(q)
  stick.position.copy(n.clone().multiplyScalar(GLOBE_RADIUS + stickHeight / 2))
  stick.name = `stick-${lat}-${lon}`
  return stick
}

function createCityMarker(THREE, lat, lon, colorHex) {
  const p = vec(THREE, lat, lon)
  const g = new THREE.SphereGeometry(0.028, 16, 16)
  const m = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0
  })
  const mesh = new THREE.Mesh(g, m)
  mesh.position.copy(p.clone().multiplyScalar(1.002))
  return mesh
}

/**
 * Scène procédurale Ératosthène (globe, marqueurs, bâtons, arcs, cercle 50 segments).
 */
export function createEratosthenesScene(THREE) {
  const group = new THREE.Group()
  group.name = "EratosthenesScene"

  const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x1c4f7a,
    roughness: 0.78,
    metalness: 0.06,
    emissive: 0x051525,
    emissiveIntensity: 0.2
  })
  const earth = new THREE.Mesh(earthGeo, earthMat)
  earth.receiveShadow = true
  group.add(earth)

  const syeneMarker = createCityMarker(THREE, CITIES.syene.lat, CITIES.syene.lon, CITIES.syene.color)
  const alexMarker = createCityMarker(THREE, CITIES.alexandria.lat, CITIES.alexandria.lon, CITIES.alexandria.color)
  group.add(syeneMarker, alexMarker)

  const stickSyene = createStick(THREE, CITIES.syene.lat, CITIES.syene.lon)
  const stickAlex = createStick(THREE, CITIES.alexandria.lat, CITIES.alexandria.lon)
  group.add(stickSyene, stickAlex)

  const P_sy = vec(THREE, CITIES.syene.lat, CITIES.syene.lon)
  const P_al = vec(THREE, CITIES.alexandria.lat, CITIES.alexandria.lon)

  /* Arc de grand cercle Syène–Alexandrie (approximation sur la sphère) */
  const arcPts = []
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = P_sy.clone().lerp(P_al, t).normalize().multiplyScalar(GLOBE_RADIUS * 1.008)
    arcPts.push(p)
  }
  const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts)
  const arcMat = new THREE.LineBasicMaterial({
    color: 0xffe066,
    transparent: true,
    opacity: 0
  })
  const arcLine = new THREE.Line(arcGeo, arcMat)
  group.add(arcLine)

  /* Angle 7,2° — petit arc dans le plan (soleil / bâton) — schématique près d’Alexandrie */
  const angleArcRadius = 0.12
  const anglePts = []
  const angleSteps = 12
  const base = P_al.clone().normalize()
  const aux = new THREE.Vector3(0, 1, 0)
  if (Math.abs(base.dot(aux)) > 0.95) aux.set(1, 0, 0)
  const t1 = new THREE.Vector3().crossVectors(aux, base).normalize()
  const t2 = new THREE.Vector3().crossVectors(base, t1).normalize()
  const center = P_al.clone().multiplyScalar(1.05)
  const rad = (ERATOSTHENES.shadowAngleDegrees * Math.PI) / 180
  for (let i = 0; i <= angleSteps; i++) {
    const u = (i / angleSteps) * rad
    const pt = center
      .clone()
      .add(t1.clone().multiplyScalar(Math.cos(u) * angleArcRadius))
      .add(t2.clone().multiplyScalar(Math.sin(u) * angleArcRadius))
    anglePts.push(pt)
  }
  const angleGeo = new THREE.BufferGeometry().setFromPoints(anglePts)
  const angleMat = new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0 })
  const angleLine = new THREE.Line(angleGeo, angleMat)
  group.add(angleLine)

  const labelDiv = document.createElement("div")
  labelDiv.className = "css2d-angle-label"
  labelDiv.textContent = `${ERATOSTHENES.shadowAngleDegrees}°`
  const angleLabel = new CSS2DObject(labelDiv)
  angleLabel.position.set(0, 0, 0)
  angleLine.add(angleLabel)

  /* Rayons solaires (lignes jaunes parallèles, schématique) */
  const sunRayGroup = new THREE.Group()
  /** Partagé par tous les segments (dispose unique). */
  const sunRayMat = new THREE.LineBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0 })
  const sunDir = P_sy.clone().normalize()
  for (let i = -7; i <= 7; i++) {
    const offset = new THREE.Vector3(i * 0.07, i * 0.02, 0)
    const o = P_sy.clone().add(offset)
    const a = o.clone().add(sunDir.clone().multiplyScalar(1.6))
    const b = o.clone().add(sunDir.clone().multiplyScalar(-0.3))
    const g = new THREE.BufferGeometry().setFromPoints([a, b])
    sunRayGroup.add(new THREE.Line(g, sunRayMat))
  }
  group.add(sunRayGroup)

  /* Lignes pointillées vers le centre (schéma) */
  const dashGroup = new THREE.Group()
  const dashMat = new THREE.LineDashedMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    dashSize: 0.04,
    gapSize: 0.03
  })
  for (const p of [P_sy, P_al]) {
    const g2 = new THREE.BufferGeometry().setFromPoints([p.clone().multiplyScalar(0.98), new THREE.Vector3(0, 0, 0)])
    const ln = new THREE.Line(g2, dashMat)
    ln.computeLineDistances()
    dashGroup.add(ln)
  }
  group.add(dashGroup)

  /* Cercle 50 segments autour du globe (plan équatorial local — axe Y monde) */
  const circleGroup = new THREE.Group()
  const ringR = GLOBE_RADIUS * 1.78
  const highlightIndex = 0
  for (let i = 0; i < ERATOSTHENES.fractionOfCircle; i++) {
    const a0 = (i / ERATOSTHENES.fractionOfCircle) * Math.PI * 2
    const a1 = ((i + 1) / ERATOSTHENES.fractionOfCircle) * Math.PI * 2
    const pts = [
      new THREE.Vector3(Math.cos(a0) * ringR, 0, Math.sin(a0) * ringR),
      new THREE.Vector3(Math.cos(a1) * ringR, 0, Math.sin(a1) * ringR)
    ]
    const col = i === highlightIndex ? 0xffd700 : 0x446688
    const mat = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0
    })
    const seg = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
    circleGroup.add(seg)
  }
  group.add(circleGroup)

  function setOpacity(mat, v) {
    if (mat && "opacity" in mat) {
      mat.opacity = v
      mat.transparent = v < 1
    }
  }

  /**
   * @param {object} v — champs 0..1 : syene, alex, arc, sticks, sunRays, diagram, angleArc, circle
   */
  function updateVisuals(v) {
    setOpacity(syeneMarker.material, v.syene)
    setOpacity(alexMarker.material, v.alex)
    setOpacity(arcLine.material, v.arc)
    setOpacity(stickSyene.material, v.sticks)
    setOpacity(stickAlex.material, v.sticks)
    setOpacity(angleLine.material, v.angleArc)
    sunRayGroup.children.forEach((ln) => setOpacity(ln.material, v.sunRays))
    dashGroup.children.forEach((ln) => setOpacity(ln.material, v.diagram))
    circleGroup.children.forEach((ln) => setOpacity(ln.material, v.circle))
    labelDiv.style.opacity = String(v.angleArc)
  }

  function dispose() {
    earthGeo.dispose()
    earthMat.dispose()
    syeneMarker.geometry.dispose()
    syeneMarker.material.dispose()
    alexMarker.geometry.dispose()
    alexMarker.material.dispose()
    stickSyene.geometry.dispose()
    stickSyene.material.dispose()
    stickAlex.geometry.dispose()
    stickAlex.material.dispose()
    arcGeo.dispose()
    arcMat.dispose()
    angleGeo.dispose()
    angleMat.dispose()
    sunRayGroup.children.forEach((ln) => {
      ln.geometry.dispose()
    })
    sunRayMat.dispose()
    dashGroup.children.forEach((ln) => {
      ln.geometry.dispose()
    })
    dashMat.dispose()
    circleGroup.children.forEach((ln) => {
      ln.geometry.dispose()
      ln.material.dispose()
    })
  }

  return {
    group,
    updateVisuals,
    dispose,
    /** Direction du soleil (vers la Terre) pour ombres : opposé au rayon depuis le centre vers Syène */
    getSunDirectionToEarth() {
      return P_sy.clone().normalize().negate()
    },
    getSyeneNormal() {
      return P_sy.clone().normalize()
    }
  }
}
