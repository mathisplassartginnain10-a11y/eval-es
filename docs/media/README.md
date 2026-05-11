# Médias des étapes

Place ici les fichiers référencés dans `src/sections.js` (`docs/media/`).

- **`placeholder.svg`** : image de secours utilisée par défaut pour les étapes sans encore de vrai fichier (pas de requêtes vers des `01.mp4` manquants).
- **Image** : `jpg`, `png`, `webp`, `svg`, …
- **Vidéo** : `mp4`, `webm`, …

Tu peux mélanger les deux d’un slide à l’autre : dans `KEYFRAMES`, mets `type: "image"` ou `type: "video"` pour chaque étape. Remplace `PLACEHOLDER` par ex. `{ type: "video", file: "01.mp4" }` quand tu ajoutes la vidéo.

Vidéos ailleurs que `docs/media/` : utilise `path: "videos/…/fichier.mp4"` dans `sections.js` (comme l’étape 2, Terre aplatie).

Si la console affiche encore une ancienne URL (ex. `vidéo terre_plate.mp4`), le code actuel utilise `vidéo terre_aplatie.mp4` : fais un rechargement forcé (Ctrl+F5) ou augmente `?v=` dans `index.html` sur la balise `main.js`.
