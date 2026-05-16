/**
 * Textes par étape (clés step01…step06) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "", extras = {}) {
  return { rubrique, titre, sousTitre: "", paragraphes, credit, ...extras }
}

export const CONTENT = {
  step01: step(
    "",
    "LA TERRE N'EST PAS RONDE",
    [],
    "",
    {
      titleUnderline: true,
      introPoster: true,
      sommaire: true,
      sommaireItems: [
        { part: "Première partie", titre: "L'expérience d'Eratosthène", scrollIndex: 1 },
        { part: "Seconde partie", titre: "Les irrégularités de Surface", scrollIndex: 2 },
        { part: "Troisième partie", titre: "La gravité et la forme de la Terre", scrollIndex: 3 },
        { part: "Quatrième partie", titre: "Les modifications typographiques", scrollIndex: 4 },
        { part: "Cinquième partie", titre: "Conclusion", scrollIndex: 5 },
      ],
    }
  ),
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
  step04: step("Troisième partie :", "La gravité et la forme de la Terre", [], "", { partTitle: true }),
  step05: step(
    "Quatrième partie :",
    "Les modifications typographiques",
    [
      "La forme de la Terre ne se joue pas seulement dans l’espace : la tectonique des plaques déplace sans cesse les continents, de quelques centimètres à une vingtaine par an.",
      "Là où les plaques se poussent, naissent chaînes et reliefs ; là où elles s’écartent, s’ouvrent rifts et dorsales. La surface reste ainsi en mouvement — la planète n’est pas une sphère figée, mais un globe vivant, toujours en train de se déformer.",
    ],
    "",
    { partTitle: true }
  ),
  step06: step(
    "Conclusion :",
    "",
    [
      "Calcul d'Ératosthène : 250 000 stades",
      "Déformation au pôle : 0,3 %",
      "Formule de la gravité : F = G × (m₁ × m₂) / r²",
      "Modification typographique : jusqu'à 20 km d'écart",
    ],
    "",
    { partTitle: true }
  ),
}

/** Libellés des points de navigation */
export const SECTION_LABELS = [
  "Sommaire",
  "Première partie :",
  "Seconde Partie :",
  "Troisième partie :",
  "Les modifications typographiques",
  "Conclusion"
]
