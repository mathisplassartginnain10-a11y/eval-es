/**
 * Données scientifiques (partie 2 — Ératosthène & GOCE).
 * Les textes longs restent dans content.js (placeholders élèves).
 */

export const CITIES = {
  syene: {
    name: "Syène (Assouan)",
    lat: 24.09,
    lon: 32.9,
    color: 0xffd700
  },
  alexandria: {
    name: "Alexandrie",
    lat: 31.2,
    lon: 29.92,
    color: 0xff4500
  }
}

export const ERATOSTHENES = {
  shadowAngleDegrees: 7.2,
  distanceKm: 800,
  calculatedCircumferenceKm: 40000,
  realCircumferenceKm: 40075,
  fractionOfCircle: 50
}

export const GOCE = {
  launchDate: "17 mars 2009",
  endDate: "11 novembre 2013",
  altitudeKm: 255,
  orbitInclinationDegrees: 96.7,
  polarFlatteningKm: 21,
  precisionFraction: "milliardième de la pesanteur",
  agency: "ESA",
  nickname: "La Ferrari de l'espace"
}

/** Sentinelles pour le chargeur (pas de fichier GLB/OBJ). */
export const PROCEDURAL_ERATOSTHENE = "__procedural_eratosthene__"
export const PROCEDURAL_GOCE = "__procedural_goce__"
export const SCENE_TRANSITION = "__scene_transition__"
