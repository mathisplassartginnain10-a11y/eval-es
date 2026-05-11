# Modèles 3D

Chemins **relatifs** (compatible GitHub Pages). Les noms ci-dessous doivent **correspondre exactement** au code dans `src/sections.js` (ou adaptez ce fichier).

## Fichiers utilisés par le site

| Fichier | Partie | Rôle |
|---------|--------|------|
| `Meshy_AI_Earth_on_a_Cone_0511114642_texture.glb` | **Partie 1** (intro) | 1ᵉʳ modèle — première moitié du défilement de l’étape 1 |
| Dossier `Meshy_AI_Edge_of_the_World_0511163858_texture_fbx/` (`.fbx` + textures au même niveau) | **Partie 1** | 2ᵉ modèle — fichier attendu : `Meshy_AI_Edge_of_the_World_0511163858_texture.fbx` |
| `Earth 2K.obj` | **Partie 2** et suivantes | Globe pour « pas ronde », « ronde » et conclusion |
| `Earth 2K.mtl` | (avec l’OBJ) | Matériaux — même dossier que l’OBJ |

Le fichier **`Earth 2K.mtl`** référence **obligatoirement** les PNG dans `Textures/` (`Diffuse_2K`, `Bump_2K`, `Clouds_2K`). Ils sont versionnés dans le dépôt même si c’est lourd, pour que le globe s’affiche correctement en ligne.

## Si un fichier manque

Le chargeur affiche une **sphère bleue** de secours pour ce modèle.

## Formats

- **`.glb`** : chargés via `GLTFLoader`
- **`.fbx`** : chargés via `FBXLoader` (textures externes = même dossier que le `.fbx`)
- **`.obj` + `.mtl`** : chargés via `OBJLoader` + `MTLLoader`
