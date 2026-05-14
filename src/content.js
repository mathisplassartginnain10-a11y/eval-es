/**
 * Textes par étape (clés step01…step06) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "", extras = {}) {
  return { rubrique, titre, sousTitre: "", paragraphes, credit, ...extras }
}

export const CONTENT = {
  step01: step("", "LA TERRE N'EST PAS RONDE", [], "", { titleUnderline: true, introPoster: true }),
  step02: step(
    "Première partie :",
    "L'expérience d'Eratosthène",
    [
      "Ératosthène compare l’ombre au solstice d’été entre Syène et Alexandrie : la différence d’angle traduit la courbure.",
      "Les chiffres clés (ex. 7,2° et ordre de grandeur des distances) illustrent une mesure cohérente avec une Terre sphérique.",
    ],
    "",
    { titleUnderline: true, partTitle: true }
  ),
  step03: step("Seconde Partie :", "Les irrégularités de Surface", ["À compléter ou détailler selon votre script."], "", {
    partTitle: true,
  }),
  step04: step("Troisième partie :", "à compléter", [], "", { partTitle: true }),
  step05: step(
    "Quatrième partie :",
    "La déformation topographique de la Terre",
    [
      "La Terre n'est pas une sphère parfaite — elle est aplatie aux pôles de 21 km. Cette déformation, invisible à l'œil nu depuis l'espace, est prouvée par le satellite GOCE (ESA, 2009-2013) et formalisée par le standard WGS 84 depuis 1984.",
    ],
    "",
    { partTitle: true }
  ),
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
