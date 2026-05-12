/**
 * Textes par étape (clés step01…step06) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "") {
  return { rubrique, titre, sousTitre: "", paragraphes, credit }
}

export const CONTENT = {
  step01: step(
    "Etape :",
    "La Terre n'est pas ronde",
    [
      "Première partie : L'expérience d'Eratosthène",
      "Seconde Partie : Les irrégularités de Surface",
      "Troisième partie : à compléter",
      "Quatrième partie : La déformation typographique de la terre."
    ]
  ),
  step02: step("Première partie :", "L'expérience d'Eratosthène", []),
  step03: step("Seconde Partie :", "Les irrégularités de Surface", []),
  step04: step("Troisième partie :", "à compléter", []),
  step05: step("Quatrième partie :", "La déformation typographique de la terre.", []),
  step06: step("Etape :", "à compléter", [])
}

/** Libellés des points de navigation */
export const SECTION_LABELS = [
  "Etape :",
  "Première partie :",
  "Seconde Partie :",
  "Troisième partie :",
  "Quatrième partie :",
  "à compléter"
]
