import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Stars, ContactShadows } from "@react-three/drei"
import { EarthModel } from "./EarthModel.jsx"

function LoadingFallback() {
  return (
    <mesh>
      <icosahedronGeometry args={[0.65, 2]} />
      <meshStandardMaterial
        color="#3a5a8a"
        emissive="#1a3050"
        emissiveIntensity={0.4}
        roughness={0.35}
        metalness={0.25}
      />
    </mesh>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.22} color="#b8c4e8" />
      <directionalLight
        position={[8, 6, 4]}
        intensity={2.1}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-6, 2, -5]} intensity={0.55} color="#6a8cff" />
      <directionalLight position={[0, -4, 8]} intensity={0.35} color="#304060" />
    </>
  )
}

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      }}
    >
      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#030308", 12, 38]} />

      <PerspectiveCamera makeDefault position={[0, 0.35, 5.2]} fov={42} near={0.1} far={200} />

      <Stars radius={80} depth={40} count={6000} factor={3} saturation={0} fade speed={0.3} />

      <Lights />

      <Suspense fallback={<LoadingFallback />}>
        <EarthModel />
      </Suspense>

      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.55}
        scale={12}
        blur={2.5}
        far={5}
        color="#050508"
      />

      <OrbitControls
        enablePan={false}
        minDistance={2.2}
        maxDistance={14}
        maxPolarAngle={Math.PI * 0.92}
        minPolarAngle={Math.PI * 0.12}
        target={[0, 0, 0]}
        dampingFactor={0.06}
        enableDamping
      />
    </Canvas>
  )
}
