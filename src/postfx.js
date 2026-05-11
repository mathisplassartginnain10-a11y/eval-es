import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { VignetteShader } from "three/addons/shaders/VignetteShader.js"

/**
 * Post-processing : bloom + vignette. Retourne null si non supporté.
 */
export function createPostProcessing(scene, camera, renderer) {
  try {
    const w = window.innerWidth
    const h = window.innerHeight
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const resolution = new THREE.Vector2(w, h)
    const bloom = new UnrealBloomPass(resolution, 1.4, 0.8, 0.2)
    composer.addPass(bloom)

    const vignettePass = new ShaderPass(VignetteShader)
    if (vignettePass.uniforms.offset) vignettePass.uniforms.offset.value = 0.5
    if (vignettePass.uniforms.darkness) vignettePass.uniforms.darkness.value = 0.7
    composer.addPass(vignettePass)

    function setSize(width, height) {
      resolution.set(width, height)
      if (typeof bloom.setSize === "function") {
        bloom.setSize(width, height)
      }
      composer.setSize(width, height)
    }

    return {
      composer,
      render: () => composer.render(),
      setSize
    }
  } catch {
    return null
  }
}
