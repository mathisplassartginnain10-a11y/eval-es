/**
 * Textes par étape (6) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "") {
  return { rubrique, titre, sousTitre: "", paragraphes, credit }
}

export const CONTENT = {
  step01: step("Étape 1", "Titre\nà compléter", ["Paragraphe d’introduction à compléter."]),
  step02: step(
    "Partie 2",
    "Expérience d’Eratosthène",
    ["Syène : 24° Nord", "Alexandrie : 31° Nord", "Circonférence : 500 000 stades"]
  ),
  step03: step("Étape 3", "Titre\nà compléter", ["Contenu à compléter."]),
  step04: step("Étape 4", "Titre\nà compléter", ["Contenu à compléter."]),
  step05: step("Étape 5", "Titre\nà compléter", ["Contenu à compléter."]),
  step06: step("Étape 6", "Conclusion\nà compléter", ["Synthèse à compléter."])
}

export const SECTION_LABELS = [
  "Étape 1",
  "Partie 2",
  "Étape 3",
  "Étape 4",
  "Étape 5",
  "Étape 6"
]
