import gsap from "gsap"
import { runHyperspaceWarp } from "./starsBg.js"
import { MOTION, layerShift } from "./motionDesign.js"

/** Voile léger synchronisé au pic du warp. */
function playTransitionVeil(root, warpSec) {
  if (!(root instanceof HTMLElement)) return () => {}

  const veil = root.querySelector(".page-transition__veil")
  if (!(veil instanceof HTMLElement)) return () => {}

  root.classList.add("is-active")
  root.setAttribute("aria-hidden", "false")
  gsap.killTweensOf(veil)
  gsap.set(veil, { opacity: 0 })

  const fadeIn = warpSec * 0.18
  const fadeOut = warpSec * 0.55
  const tl = gsap.timeline()

  tl.to(veil, { opacity: 0.18, duration: fadeIn, ease: MOTION.ease.in }, 0)
  tl.to(veil, { opacity: 0, duration: fadeOut, ease: MOTION.ease.drift }, fadeIn + warpSec * 0.12)

  return () => {
    tl.kill()
    root.classList.remove("is-active")
    root.setAttribute("aria-hidden", "true")
    gsap.set(veil, { clearProps: "opacity" })
  }
}

/**
 * Transition de page : sortie → warp → changement d’étape → entrée (enchaînement unique).
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
    transitionRoot,
    isIpadLike = false,
  } = opts

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
      direction,
      applySection,
      done,
      getTextTargets,
      media,
      textOverlay,
      isIpadLike,
    })
    return
  }

  runPageWarpTransition({
    direction,
    applySection,
    done,
    getTextTargets,
    media,
    textOverlay,
    transitionRoot,
    isIpadLike,
  })
}

function runPageWarpTransition({
  direction,
  applySection,
  done,
  getTextTargets,
  media,
  textOverlay,
  transitionRoot,
  isIpadLike,
}) {
  const isBack = direction < 0
  const shift = layerShift(isBack)
  const exitDur = MOTION.dur.pageExit(isIpadLike)
  const revealDur = MOTION.dur.pageReveal(isIpadLike)
  const overlap = MOTION.dur.pageOverlap(isIpadLike)
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)
  const allLayers = [media, textOverlay, ...textOut].filter(Boolean)

  let stopVeil = () => {}
  let warpFinished = false
  let revealFinished = false
  let finished = false

  const tryComplete = () => {
    if (finished || !warpFinished || !revealFinished) return
    finished = true
    stopVeil()
    gsap.set([...allLayers, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
    if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    done()
  }

  gsap.killTweensOf(allLayers)

  const exit = gsap.timeline()

  if (media) {
    exit.to(
      media,
      {
        autoAlpha: MOTION.alpha.dim,
        y: shift.mediaY * 0.35,
        scale: MOTION.offset.mediaScaleOut,
        duration: exitDur,
        ease: MOTION.ease.in,
        force3D: true,
      },
      0
    )
  }

  if (textOut.length) {
    exit.to(
      textOut,
      {
        autoAlpha: MOTION.alpha.dim,
        y: shift.textY * 0.5,
        duration: exitDur * 0.92,
        ease: MOTION.ease.in,
        stagger: { each: 0.022, from: isBack ? "end" : "start" },
        force3D: true,
      },
      overlap * 0.15
    )
  }

  const warpStart = exitDur * 0.4

  exit.add(() => {
    stopVeil = playTransitionVeil(transitionRoot, MOTION.warpSec)

    runHyperspaceWarp({
      durationSec: MOTION.warpSec,
      onCut: () => {
        applySection()

        const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)

        if (media) {
          gsap.set(media, {
            autoAlpha: MOTION.alpha.reveal,
            y: shift.mediaY * 0.4,
            scale: MOTION.offset.mediaScaleIn,
            force3D: true,
          })
        }
        if (textIn.length) {
          gsap.set(textIn, {
            autoAlpha: MOTION.alpha.reveal,
            y: shift.textY * 0.45,
            force3D: true,
          })
        }

        const markRevealDone = () => {
          revealFinished = true
          tryComplete()
        }

        if (!media && !textIn.length) {
          markRevealDone()
          return
        }

        const reveal = gsap.timeline({ onComplete: markRevealDone })

        if (media) {
          reveal.to(
            media,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: revealDur,
              ease: MOTION.ease.settle,
              force3D: true,
            },
            0
          )
        }

        if (textIn.length) {
          reveal.to(
            textIn,
            {
              autoAlpha: 1,
              y: 0,
              duration: revealDur * 0.9,
              ease: MOTION.ease.settle,
              stagger: { each: 0.035, from: isBack ? "end" : "start" },
              force3D: true,
            },
            revealDur * 0.08
          )
        }
      },
      onComplete: () => {
        warpFinished = true
        tryComplete()
      },
    })
  }, warpStart)
}

function runMiniTransition({
  direction,
  applySection,
  done,
  getTextTargets,
  media,
  textOverlay,
  isIpadLike,
}) {
  const isBack = direction < 0
  const shift = layerShift(isBack)
  const total = MOTION.dur.miniTotal(isIpadLike)
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([media, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      done()
    },
  })

  const cut = total * 0.42

  if (textOut.length) {
    tl.to(
      textOut,
      {
        autoAlpha: MOTION.alpha.dim,
        y: shift.textY * 0.4,
        duration: total * 0.3,
        ease: MOTION.ease.inOut,
        stagger: 0.018,
        force3D: true,
      },
      0
    )
  }

  if (media) {
    tl.to(
      media,
      {
        autoAlpha: MOTION.alpha.dim,
        scale: MOTION.offset.mediaScaleOut,
        duration: total * 0.3,
        ease: MOTION.ease.inOut,
        force3D: true,
      },
      0
    )
  }

  tl.add(() => {
    applySection()
    const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
    if (textIn.length) {
      gsap.set(textIn, {
        autoAlpha: MOTION.alpha.reveal,
        y: shift.textY * 0.35,
        force3D: true,
      })
    }
    if (media) {
      gsap.set(media, {
        autoAlpha: MOTION.alpha.reveal,
        y: shift.mediaY * 0.35,
        scale: MOTION.offset.mediaScaleIn,
        force3D: true,
      })
    }
  }, cut)

  if (media) {
    tl.to(
      media,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: total * 0.48,
        ease: MOTION.ease.settle,
        force3D: true,
      },
      cut + 0.04
    )
  }

  if (textOut.length) {
    tl.to(
      getTextTargets().filter((el) => el instanceof HTMLElement),
      {
        autoAlpha: 1,
        y: 0,
        duration: total * 0.45,
        ease: MOTION.ease.settle,
        stagger: 0.025,
        force3D: true,
      },
      cut + 0.06
    )
  }
}
