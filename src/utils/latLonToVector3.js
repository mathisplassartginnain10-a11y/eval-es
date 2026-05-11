/**
 * Conversion lat/lon (degrés) → coordonnées cartésiennes sur une sphère.
 * @returns {{ x: number, y: number, z: number }}
 */
export function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return { x, y, z }
}
