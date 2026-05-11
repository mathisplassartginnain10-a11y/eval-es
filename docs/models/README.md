# Modèles 3D

Le site charge les fichiers **tels qu’ils sont rangés** sous `docs/models/` (voir `src/sections.js`).

## Dossiers utilisés

| Dossier | Fichier chargé | Sections |
|---------|----------------|----------|
| **`terre_triangle/`** | `Meshy_AI_Earth_on_a_Cone_0511170434_texture.fbx` (+ PNG à côté) | Introduction |
| **`terre_aplatie/`** | `terre_aplatie.fbx` (+ PNG à côté) | La Terre n'est pas ronde |
| **`terre_sphère/`** | `Earth 2K.fbx` (ou `Earth 2K.obj` + `Earth 2K.mtl`) | La Terre est ronde, Conclusion |
| **Racine `docs/models/`** | `Meshy_AI_Earth_on_a_Cone_0511114642_texture.glb` (optionnel) | — |

Les textures du globe **Earth 2K** sont dans **`docs/models/Textures/`** (chemins relatifs corrigés dans `terre_sphère/Earth 2K.mtl`).

## Si un fichier manque

Le chargeur affiche une **sphère bleue** de secours.

## Formats

`.fbx` (FBXLoader), `.obj` + `.mtl` (OBJLoader + MTLLoader), `.glb` / `.gltf` (GLTFLoader) — voir `src/loader.js`.
