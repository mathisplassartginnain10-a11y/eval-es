# Modèles 3D (`.glb`)

Placez ici vos fichiers **glTF binaire** pour l’exposé. Le site les charge avec des chemins **relatifs** (compatible GitHub Pages).

## Fichiers attendus

| Fichier | Section | Rôle |
|---------|---------|------|
| `terre_sphere.glb` | Intro, « ronde », conclusion | Terre représentée comme sphère (ou sphéroïde) |
| `terre_aplatie.glb` | « La Terre n’est pas ronde » | Modèle visuel aplati (oblat, schéma pédagogique, etc.) |

## Si un fichier manque

Le script affiche automatiquement une **sphère bleue** Three.js à la place, pour que la démo reste utilisable en classe.

## Conseils

- Formats : **`.glb`** uniquement (pas `.gltf` + textures séparées, sauf si vous les regroupez).
- Taille : gardez les modèles légers (géométrie et textures modérées) pour viser **~60 fps** sur un laptop.
- Vous pouvez exporter depuis Blender, Sketchfab (licence respectée), etc.

Les noms de fichiers doivent **correspondre exactement** à ceux ci-dessus, ou il faudra mettre à jour les chemins dans `src/sections.js`.
