import gsap from "gsap"
import { runHyperspaceWarp } from "./starsBg.js"
import { MOTION, layerShift } from "./motionDesign.js"

function setPageTransitioning(on, isBack, root) {
  document.body.classList.toggle("is-page-transitioning", on)
  if (root instanceof HTMLElement) {
    root.classList.toggle("page-transition--back", on && isBack)
  }
}

function playTransitionVeil(root, warpSec) {
  if (!(root instanceof HTMLElement)) return () => {}

  const veil = root.querySelector(".page-transition__veil")
  if (!(veil instanceof HTMLElement)) return () => {}

  root.classList.add("is-active")
  root.setAttribute("aria-hidden", "false")
  gsap.killTweensOf(veil)
  gsap.set(veil, { opacity: 0 })

  const fadeIn = warpSec * 0.22
  const fadeOut = warpSec * 0.48
  const tl = gsap.timeline()

  tl.to(veil, { opacity: 0.18, duration: fadeIn, ease: MOTION.ease.in }, 0)
  tl.to(veil, { opacity: 0, duration: fadeOut, ease: MOTION.ease.drift }, fadeIn + warpSec * 0.2)

  return () => {
    tl.kill()
    root.classList.remove("is-active")
    root.setAttribute("aria-hidden", "true")
    gsap.set(veil, { clearProps: "opacity" })
  }
}

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
      transitionRoot,
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
  const warpSec = MOTION.warpSec
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)
  const allLayers = [media, ...textOut].filter(Boolean)

  let stopVeil = () => {}
  let finished = false

  const finishAll = () => {
    if (finished) return
    finished = true
    stopVeil()
    setPageTransitioning(false, false, transitionRoot)
    gsap.set([...allLayers, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
    if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    done()
  }

  setPageTransitioning(true, isBack, transitionRoot)
  gsap.killTweensOf(allLayers)

  if (media) gsap.set(media, { visibility: "visible", force3D: true })
  for (const el of textOut) gsap.set(el, { visibility: "visible", force3D: true })

  const exit = gsap.timeline()

  if (media) {
    exit.to(
      media,
      {
        autoAlpha: MOTION.alpha.dim,
        y: shift.mediaY * 0.55,
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
        y: shift.textY * 0.65,
        duration: exitDur,
        ease: MOTION.ease.in,
        stagger: { each: 0.028, from: isBack ? "end" : "start" },
        force3D: true,
      },
      0.03
    )
  }

  exit.add(() => {
    stopVeil = playTransitionVeil(transitionRoot, warpSec)

    runHyperspaceWarp({
      durationSec: warpSec,
      onCut: () => {
        applySection()

        const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)

        if (media) {
          gsap.set(media, {
            visibility: "visible",
            autoAlpha: MOTION.alpha.reveal,
            y: shift.mediaY * 0.55,
            scale: MOTION.offset.mediaScaleIn,
            force3D: true,
          })
        }
        if (textIn.length) {
          gsap.set(textIn, {
            visibility: "visible",
            autoAlpha: MOTION.alpha.reveal,
            y: shift.textY * 0.55,
            force3D: true,
          })
        }

        if (!media && !textIn.length) {
          finishAll()
          return
        }

        const reveal = gsap.timeline({ onComplete: finishAll })

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
              duration: revealDur * 0.92,
              ease: MOTION.ease.settle,
              stagger: { each: 0.04, from: isBack ? "end" : "start" },
              force3D: true,
            },
            0.05
          )
        }
      },
      onComplete: () => {},
    })
  }, exitDur * 0.5)
}

function runMiniTransition({
  direction,
  applySection,
  done,
  getTextTargets,
  media,
  textOverlay,
  isIpadLike,
  transitionRoot,
}) {
  const isBack = direction < 0
  const shift = layerShift(isBack)
  const total = MOTION.dur.miniTotal(isIpadLike)
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  setPageTransitioning(true, isBack, transitionRoot)

  const tl = gsap.timeline({
    onComplete: () => {
      setPageTransitioning(false, false, transitionRoot)
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
        y: shift.textY * 0.55,
        duration: total * 0.32,
        ease: MOTION.ease.inOut,
        stagger: 0.02,
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
        duration: total * 0.32,
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
      gsap.set(textIn, { autoAlpha: MOTION.alpha.reveal, y: shift.textY * 0.45, force3D: true })
    }
    if (media) {
      gsap.set(media, {
        autoAlpha: MOTION.alpha.reveal,
        y: shift.mediaY * 0.45,
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
        duration: total * 0.5,
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
        duration: total * 0.48,
        ease: MOTION.ease.settle,
        stagger: 0.028,
        force3D: true,
      },
      cut + 0.06
    )
  }
}
