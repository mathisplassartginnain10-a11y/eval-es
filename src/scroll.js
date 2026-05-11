/* global gsap, ScrollTrigger */

import { KEYFRAMES, SECTION_COUNT } from "./sections.js"

const G = globalThis

function ensureGsap() {
  if (!G.gsap || !G.ScrollTrigger) {
    throw new Error("GSAP et ScrollTrigger doivent être chargés avant le module principal (voir index.html).")
  }
  return { gsap: G.gsap, ScrollTrigger: G.ScrollTrigger }
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Initialise ScrollTrigger et envoie l'état interpolé à chaque mise à jour.
 */
export function initScroll({ reducedMotion, onScrollState }) {
  const { gsap: gs, ScrollTrigger: ST } = ensureGsap()

  const ease = gs.parseEase("power3.inOut")

  const st = ST.create({
    start: 0,
    end: "max",
    scrub: reducedMotion ? 0 : 1,
    onUpdate: (self) => {
      const p = self.progress
      const n = SECTION_COUNT
      const x = p * n
      const idx = Math.min(Math.floor(x), n - 1)
      const frac = x - idx

      let from = KEYFRAMES[idx]
      let to = KEYFRAMES[Math.min(idx + 1, n - 1)]
      let t = 0

      if (idx < n - 1) {
        t = ease(frac)
      } else {
        from = KEYFRAMES[n - 1]
        to = KEYFRAMES[n - 1]
        t = 0
      }

      let modelUrl = from.modelFile
      if (idx < n - 1) {
        const a = from.modelFile
        const b = to.modelFile
        modelUrl = a === b ? a : frac < 0.5 ? a : b
      }

      const textKey = idx < n - 1 ? (frac < 0.5 ? from.textSection : to.textSection) : from.textSection

      onScrollState({
        progress: p,
        sectionIndex: idx,
        localFrac: frac,
        easedT: t,
        from,
        to,
        modelUrl,
        textKey
      })
    }
  })

  ST.refresh()

  return {
    refresh: () => ST.refresh(),
    kill: () => st.kill()
  }
}

/**
 * Aligne le scroll sur le début du panneau d'index donné.
 */
export function scrollToSection(index, reducedMotion) {
  const n = SECTION_COUNT
  const i = Math.max(0, Math.min(index, n - 1))
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const panels = document.querySelectorAll("#scroll-root .scroll-panel")
  const panel = panels[i]
  const targetTop = panel ? panel.offsetTop : i * window.innerHeight
  const y = Math.min(Math.max(0, targetTop), maxY)
  window.scrollTo({
    top: y,
    behavior: reducedMotion ? "auto" : "smooth"
  })
}

export { SECTION_COUNT, lerp }
