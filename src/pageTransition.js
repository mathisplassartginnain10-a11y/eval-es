import gsap from "gsap"
import { runHyperspaceWarp } from "./starsBg.js"

const WARP_SEC = 1.35

/** Index scroll de l’étape 4 (gravité → sphère). */
const STEP4_SCROLL_INDEX = 3

/**
 * @param {number} fromIndex
 * @param {number} toIndex
 * @param {number} direction
 * @returns {"radial" | "radial-reverse" | "horizontal-ltr" | "horizontal-rtl"}
 */
export function resolveWarpMode(fromIndex, toIndex, direction) {
  const forward = direction >= 0
  if (toIndex === STEP4_SCROLL_INDEX) {
    return forward ? "horizontal-ltr" : "horizontal-rtl"
  }
  if (fromIndex === STEP4_SCROLL_INDEX && !forward) {
    return "horizontal-rtl"
  }
  return forward ? "radial" : "radial-reverse"
}

/**
 * Transition de page : étoiles (accélération → arrêt doux) puis apparition progressive.
 */
export function runPageTransition(opts) {
  const {
    direction = 1,
    fromIndex = 0,
    toIndex = 0,
    subStepOnly = false,
    reducedMotion = false,
    applySection,
    done,
    getTextTargets,
    stageMediaWrap,
    textOverlay,
    transitionRoot,
    stepBadgeEl,
    isIpadLike = false,
  } = opts

  const dir = direction >= 0 ? 1 : -1
  const media = stageMediaWrap instanceof HTMLElement ? stageMediaWrap : null

  if (reducedMotion) {
    applySection()
    if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    if (media) gsap.set(media, { autoAlpha: 1, clearProps: "all" })
    gsap.set(getTextTargets(), { autoAlpha: 1, clearProps: "all" })
    done()
    return
  }

  if (subStepOnly) {
    runMiniTransition({
      dir,
      applySection,
      done,
      getTextTargets,
      media,
      textOverlay,
      isIpadLike,
    })
    return
  }

  const warpMode = resolveWarpMode(fromIndex, toIndex, direction)

  runStarsThenReveal({
    dir,
    fromIndex,
    toIndex,
    applySection,
    done,
    getTextTargets,
    media,
    textOverlay,
    transitionRoot,
    stepBadgeEl,
    isIpadLike,
    warpMode,
  })
}

/**
 * Rideau cosmique synchronisé au warp (miroir en retour arrière).
 * @returns {() => void}
 */
function playCosmicCurtain({ root, dir, toIndex, durationSec }) {
  if (!(root instanceof HTMLElement)) return () => {}

  const isBack = dir < 0
  root.classList.toggle("page-transition--back", isBack)
  root.classList.add("is-active")
  root.setAttribute("aria-hidden", "false")

  const veil = root.querySelector(".page-transition__veil")
  const beam = root.querySelector(".page-transition__beam")
  const wipeA = root.querySelector(".page-transition__wipe--a")
  const wipeB = root.querySelector(".page-transition__wipe--b")
  const flare = root.querySelector(".page-transition__flare")
  const ring = root.querySelector(".page-transition__ring")
  const step = root.querySelector(".page-transition__step")

  const targets = [veil, beam, wipeA, wipeB, flare, ring, step].filter(
    (el) => el instanceof HTMLElement
  )
  gsap.killTweensOf(targets)

  gsap.set(targets, { clearProps: "opacity,transform,scale,filter" })
  if (veil instanceof HTMLElement) gsap.set(veil, { opacity: 0 })
  if (beam instanceof HTMLElement) {
    gsap.set(beam, {
      opacity: 0,
      xPercent: isBack ? 120 : -120,
      scaleX: isBack ? -1 : 1,
    })
  }
  if (wipeA instanceof HTMLElement) {
    gsap.set(wipeA, { scaleX: 0, transformOrigin: isBack ? "100% 50%" : "0% 50%" })
  }
  if (wipeB instanceof HTMLElement) {
    gsap.set(wipeB, { scaleX: 0, transformOrigin: isBack ? "100% 50%" : "0% 50%" })
  }
  if (flare instanceof HTMLElement) gsap.set(flare, { opacity: 0, scale: 0.6 })
  if (ring instanceof HTMLElement) gsap.set(ring, { opacity: 0, scale: 0.85 })
  if (step instanceof HTMLElement) {
    step.textContent = String(toIndex + 1)
    gsap.set(step, { opacity: 0, scale: 0.88, y: 12 })
  }

  const peak = durationSec * 0.38
  const fadeOut = durationSec * 0.48

  const tl = gsap.timeline()

  tl.to(veil, { opacity: 1, duration: peak * 0.35, ease: "sine.in" }, 0)

  if (beam instanceof HTMLElement) {
    tl.to(
      beam,
      {
        opacity: 0.95,
        xPercent: isBack ? -8 : 8,
        duration: peak * 0.55,
        ease: "power3.inOut",
      },
      0.02
    )
  }

  if (wipeA instanceof HTMLElement) {
    tl.to(wipeA, { scaleX: 1, duration: peak * 0.62, ease: "power2.inOut" }, 0.04)
  }
  if (wipeB instanceof HTMLElement) {
    tl.to(wipeB, { scaleX: 1, duration: peak * 0.72, ease: "power2.inOut" }, 0.08)
  }

  if (flare instanceof HTMLElement) {
    tl.to(flare, { opacity: 0.85, scale: 1.08, duration: peak * 0.4, ease: "power2.out" }, peak * 0.22)
  }
  if (ring instanceof HTMLElement) {
    tl.to(
      ring,
      { opacity: 0.7, scale: 1.12, duration: peak * 0.45, ease: "power2.out" },
      peak * 0.2
    )
  }
  if (step instanceof HTMLElement) {
    tl.to(
      step,
      { opacity: 1, scale: 1, y: 0, duration: peak * 0.38, ease: "back.out(1.4)" },
      peak * 0.28
    )
  }

  tl.to(
    [veil, beam, wipeA, wipeB, flare, ring, step].filter(Boolean),
    { opacity: 0, duration: fadeOut, ease: "sine.inOut", stagger: 0.02 },
    peak
  )

  return () => {
    tl.kill()
    root.classList.remove("is-active", "page-transition--back")
    root.setAttribute("aria-hidden", "true")
    gsap.set(targets, { clearProps: "opacity,transform,scale,filter" })
  }
}

function runStarsThenReveal({
  dir,
  toIndex,
  applySection,
  done,
  getTextTargets,
  media,
  textOverlay,
  transitionRoot,
  stepBadgeEl,
  isIpadLike,
  warpMode = "radial",
}) {
  const isBack = dir < 0
  const slideOut = isBack ? -32 : 32
  const slideIn = isBack ? 28 : -28
  const fadeInDur = isIpadLike ? 0.95 : 1.1
  const hideDur = isBack ? 0.22 : 0.18
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)
  let revealDone = false
  let stopCurtain = () => {}

  const finishAll = () => {
    if (revealDone) return
    revealDone = true
    stopCurtain()
    gsap.set([media, textOverlay, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
    if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    done()
  }

  gsap.killTweensOf([media, textOverlay, ...textOut].filter(Boolean))

  if (media) {
    gsap.to(media, {
      autoAlpha: 0,
      x: slideOut * 0.35,
      duration: hideDur,
      ease: isBack ? "power2.inOut" : "sine.in",
    })
  }
  if (textOut.length) {
    gsap.to(textOut, {
      autoAlpha: 0,
      x: slideOut,
      duration: hideDur,
      ease: isBack ? "power2.inOut" : "sine.in",
      stagger: isBack ? 0.04 : 0.025,
    })
  }

  gsap.delayedCall(hideDur * 0.55, () => {
    stopCurtain = playCosmicCurtain({
      root: transitionRoot,
      dir,
      toIndex,
      durationSec: WARP_SEC,
    })

    if (stepBadgeEl instanceof HTMLElement) {
      stepBadgeEl.textContent = String(toIndex + 1)
    }

    runHyperspaceWarp({
      durationSec: WARP_SEC,
      warpMode,
      onCut: () => {
        applySection()

        const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
        if (media) gsap.set(media, { autoAlpha: 0, y: 10, x: slideIn * 0.35 })
        if (textIn.length) gsap.set(textIn, { autoAlpha: 0, y: 8, x: slideIn })

        const reveal = gsap.timeline({ onComplete: finishAll })

        if (media) {
          reveal.to(
            media,
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: fadeInDur,
              ease: isBack ? "power3.out" : "sine.out",
            },
            0.08
          )
        }
        if (textIn.length) {
          reveal.to(
            textIn,
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: fadeInDur,
              ease: isBack ? "power3.out" : "sine.out",
              stagger: isBack ? 0.06 : 0.05,
            },
            0.14
          )
        }
      },
      onComplete: () => {},
    })
  })
}

function runMiniTransition({ dir, applySection, done, getTextTargets, media, textOverlay, isIpadLike }) {
  const isBack = dir < 0
  const dur = isIpadLike ? 0.34 : 0.42
  const slide = isBack ? 22 : -22
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([media, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      done()
    },
  })

  if (textOut.length) {
    tl.to(
      textOut,
      {
        autoAlpha: 0,
        x: -slide,
        duration: dur * 0.35,
        ease: "power2.in",
        stagger: 0.02,
      },
      0
    )
  }
  if (media) {
    tl.to(media, { autoAlpha: 0, x: slide * 0.5, duration: dur * 0.35, ease: "power2.in" }, 0)
  }

  tl.add(() => {
    applySection()
    const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
    if (textIn.length) gsap.set(textIn, { autoAlpha: 0, x: slide })
    if (media) gsap.set(media, { autoAlpha: 0, x: -slide * 0.5 })

    if (media) {
      gsap.to(media, {
        autoAlpha: 1,
        x: 0,
        duration: dur * 0.5,
        ease: isBack ? "power3.out" : "power2.out",
      })
    }
    if (textIn.length) {
      gsap.to(textIn, {
        autoAlpha: 1,
        x: 0,
        duration: dur * 0.45,
        ease: isBack ? "power3.out" : "power2.out",
        stagger: 0.025,
        delay: 0.04,
      })
    }
  }, dur * 0.32)

  tl.to({}, { duration: dur * 0.55 }, dur * 0.32)
}
