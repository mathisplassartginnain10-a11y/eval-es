import gsap from "gsap"
import { runHyperspaceWarp } from "./starsBg.js"

const WARP_SEC = 1.2

/**
 * Transition de page : étoiles (accélération → arrêt) puis fondu de la nouvelle page.
 */
export function runPageTransition(opts) {
  const {
    direction = 1,
    subStepOnly = false,
    reducedMotion = false,
    applySection,
    done,
    getTextTargets,
    stageMediaWrap,
    textOverlay,
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

  runStarsThenReveal({
    applySection,
    done,
    getTextTargets,
    media,
    textOverlay,
    isIpadLike,
  })
}

function runStarsThenReveal({ applySection, done, getTextTargets, media, textOverlay, isIpadLike }) {
  const fadeInDur = isIpadLike ? 0.48 : 0.55
  const hideDur = 0.14
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  gsap.killTweensOf([media, textOverlay, ...textOut].filter(Boolean))

  if (media) {
    gsap.to(media, { autoAlpha: 0, duration: hideDur, ease: "power2.in" })
  }
  if (textOut.length) {
    gsap.to(textOut, { autoAlpha: 0, duration: hideDur, ease: "power2.in", stagger: 0.02 })
  }

  gsap.delayedCall(hideDur * 0.6, () => {
    runHyperspaceWarp({
      durationSec: WARP_SEC,
      onCut: () => {
        applySection()

        const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
        if (media) gsap.set(media, { autoAlpha: 0 })
        if (textIn.length) gsap.set(textIn, { autoAlpha: 0 })

        const reveal = gsap.timeline()
        if (media) {
          reveal.to(media, { autoAlpha: 1, duration: fadeInDur, ease: "power2.out" }, 0)
        }
        if (textIn.length) {
          reveal.to(
            textIn,
            { autoAlpha: 1, duration: fadeInDur, ease: "power2.out", stagger: 0.035 },
            0.06
          )
        }
      },
      onComplete: () => {
        gsap.set([media, textOverlay, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
        if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
        done()
      },
    })
  })
}

function runMiniTransition({ dir, applySection, done, getTextTargets, media, textOverlay, isIpadLike }) {
  const dur = isIpadLike ? 0.34 : 0.42
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([media, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      done()
    },
  })

  if (textOut.length) {
    tl.to(textOut, { autoAlpha: 0, duration: dur * 0.35, ease: "power2.in", stagger: 0.02 }, 0)
  }
  if (media) {
    tl.to(media, { autoAlpha: 0, duration: dur * 0.35, ease: "power2.in" }, 0)
  }

  tl.add(() => {
    applySection()
    const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
    if (textIn.length) gsap.set(textIn, { autoAlpha: 0 })
    if (media) gsap.set(media, { autoAlpha: 0 })

    if (media) {
      gsap.to(media, { autoAlpha: 1, duration: dur * 0.5, ease: "power2.out" })
    }
    if (textIn.length) {
      gsap.to(textIn, { autoAlpha: 1, duration: dur * 0.45, ease: "power2.out", stagger: 0.025, delay: 0.04 })
    }
  }, dur * 0.32)

  tl.to({}, { duration: dur * 0.55 }, dur * 0.32)
}
