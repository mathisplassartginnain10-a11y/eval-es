/**
 * Textes par étape (10) — à personnaliser.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 */

function step(rubrique, titre, paragraphes, credit = "") {
  return { rubrique, titre, sousTitre: "", paragraphes, credit }
}

export const CONTENT = {
  step01: step("Étape 1", "Titre\nà compléter", ["Paragraphe d’introduction à compléter."]),
  step02: step("Étape 2", "Titre\nà compléter", ["Contenu à compléter."]),
  step03: step("Étape 3", "Titre\nà compléter", ["Contenu à compléter."]),
  step04: step("Étape 4", "Titre\nà compléter", ["Contenu à compléter."]),
  step05: step("Étape 5", "Titre\nà compléter", ["Contenu à compléter."]),
  step06: step("Étape 6", "Titre\nà compléter", ["Contenu à compléter."]),
  step07: step("Étape 7", "Titre\nà compléter", ["Contenu à compléter."]),
  step08: step("Étape 8", "Titre\nà compléter", ["Contenu à compléter."]),
  step09: step("Étape 9", "Titre\nà compléter", ["Contenu à compléter."]),
  step10: step("Étape 10", "Conclusion\nà compléter", ["Synthèse à compléter."])
}

export const SECTION_LABELS = [
  "Étape 1",
  "Étape 2",
  "Étape 3",
  "Étape 4",
  "Étape 5",
  "Étape 6",
  "Étape 7",
  "Étape 8",
  "Étape 9",
  "Étape 10"
]
