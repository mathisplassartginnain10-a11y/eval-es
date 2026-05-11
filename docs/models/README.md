# Modèles 3D

Chemins **relatifs** (compatible GitHub Pages). Les noms ci-dessous doivent **correspondre exactement** au code dans `src/sections.js` (ou adaptez ce fichier).

## Fichiers utilisés par le site

| Fichier | Partie | Rôle |
|---------|--------|------|
| `Meshy_AI_Earth_on_a_Cone_0511114642_texture.glb` | **Partie 1** (intro) | 1ᵉʳ modèle — première moitié du défilement de l’étape 1 |
| `Meshy_AI_Edge_of_the_World_0511114634_texture.glb` | **Partie 1** (intro) | 2ᵉ modèle — deuxième moitié de l’étape 1 |
| `Earth 2K.obj` | **Partie 2** et suivantes | Globe pour « pas ronde », « ronde » et conclusion |
| `Earth 2K.mtl` | (avec l’OBJ) | Matériaux — même dossier que l’OBJ |

Si tu ajoutes des textures référencées dans le `.mtl` (ex. dossier `Textures/`), place-les aux chemins indiqués dans le fichier MTL.

## Si un fichier manque

Le chargeur affiche une **sphère bleue** de secours pour ce modèle.

## Formats

- **`.glb`** : chargés via `GLTFLoader`
- **`.obj` + `.mtl`** : chargés via `OBJLoader` + `MTLLoader`
