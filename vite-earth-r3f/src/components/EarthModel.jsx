import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF, Center, Float } from "@react-three/drei"

const MODEL_PATH = "/models/earth.glb"

useGLTF.preload(MODEL_PATH)

/**
 * Charge earth.glb depuis public/models/ (URL absolue Vite : /models/...).
 * Center + échelle par défaut sûre ; lumières complétées dans la scène parente.
 */
export function EarthModel() {
  const group = useRef(null)
  const { scene } = useGLTF(MODEL_PATH)

  const model = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material && "envMapIntensity" in child.material) {
          child.material.envMapIntensity = 1.2
          child.material.needsUpdate = true
        }
      }
    })
    return root
  }, [scene])

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08
    }
  })

  return (
    <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.35}>
      <group ref={group}>
        <Center>
          {/* Échelles de secours : ajuster si le mesh est trop petit / grand */}
          <primitive object={model} scale={1.15} />
        </Center>
      </group>
    </Float>
  )
}
