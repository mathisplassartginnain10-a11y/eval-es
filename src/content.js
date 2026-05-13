/**
 * Textes par étape (clés step01…step06) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "", extras = {}) {
  return { rubrique, titre, sousTitre: "", paragraphes, credit, ...extras }
}

export const CONTENT = {
  step01: step("", "LA TERRE\nN'EST PAS\nRONDE", [], "", { titleUnderline: true, introPoster: true }),
  step02: step("Première partie :", "L'expérience d'Eratosthène", [], "", { titleUnderline: true }),
  step03: step("Seconde Partie :", "Les irrégularités de Surface", []),
  step04: step("Troisième partie :", "à compléter", []),
  step05: step("Quatrième partie :", "La déformation typographique de la terre.", []),
  step06: step("", "Etape :\nà compléter", [])
}

/** Libellés des points de navigation */
export const SECTION_LABELS = [
  "Introduction",
  "Première partie :",
  "Seconde Partie :",
  "Troisième partie :",
  "Quatrième partie :",
  "à compléter"
]
