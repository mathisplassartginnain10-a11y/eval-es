# Earth — React Three Fiber (Vite)

## Prérequis

- Node 18+

## Installation

```bash
cd vite-earth-r3f
npm install
```

## Modèle GLB

Copie ton fichier **`earth.glb`** dans :

```
public/models/earth.glb
```

(Le dossier `public/models/` est versionné ; le `.glb` peut être ignoré par Git s’il est trop lourd — ajoute-le localement.)

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 18
- Vite 5
- Three.js
- `@react-three/fiber`
- `@react-three/drei` (`useGLTF`, `Center`, `Float`, `OrbitControls`, `Stars`, etc.)

Le modèle est chargé uniquement avec `useGLTF("/models/earth.glb")` et préchargé via `useGLTF.preload("/models/earth.glb")`.
