import gsap from "gsap"
import { KEYFRAMES, SECTION_COUNT } from "./sections.js"

/** Durée minimale après la transition avant déverrouillage (complété par l’anim GSAP). */
const PAUSE_AFTER_MS = 180
/** Entre deux navigations déclenchées par clic / tap / clavier. */
const STEP_NAV_DELAY_MS = 1750

export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * @param {import("./sections.js").SectionKeyframe | undefined} kf
 */
function hasTwoStep(kf) {
  return !!(kf && (kf.sphereTwoStep || kf.eratoTwoStep))
}

/**
 * @param {{
 *   reducedMotion: boolean,
 *   onPageTransition: (ctx: {
 *     fromIndex: number,
 *     toIndex: number,
 *     kf: import("./sections.js").SectionKeyframe,
 *     meta: Record<string, unknown>,
 *     direction: number,
 *     subStepOnly: boolean,
 *     applySection: () => void,
 *     done: () => void,
 *   }) => void,
 *   onTransitionComplete?: (idx: number, kf: import("./sections.js").SectionKeyframe, meta: Record<string, unknown>) => void,
 *   onProgressUi?: (idx: number) => void,
 * }} opts
 */
export function initScroll({ reducedMotion, onPageTransition, onTransitionComplete, onProgressUi }) {
  let currentIndex = 0
  let sphereSubStep = 0
  let locked = false
  let lastStepNavAt = 0
  let stepNavLocked = false

  function setBodyLock(on) {
    document.body.classList.toggle("scroll-locked", on)
  }

  function releaseTransition(toIndex, kf, meta) {
    const pauseMs = reducedMotion ? 0 : PAUSE_AFTER_MS
    gsap.delayedCall(pauseMs / 1000, () => {
      locked = false
      setBodyLock(false)
      onTransitionComplete?.(toIndex, kf, meta)
    })
  }

  function runTransition(fromIndex, toIndex, kf, meta, subStepOnly, directionOverride) {
    if (locked) return

    locked = true
    setBodyLock(true)

    const direction =
      directionOverride !== undefined ? directionOverride : toIndex > fromIndex ? 1 : -1
    onProgressUi?.(toIndex)

    const finish = () => {
      currentIndex = toIndex
      if (hasTwoStep(kf) && !subStepOnly) sphereSubStep = 0
      else if (meta.sphereSubStep !== undefined) sphereSubStep = meta.sphereSubStep
      releaseTransition(toIndex, kf, meta)
    }

    onPageTransition({
      fromIndex,
      toIndex,
      kf,
      meta,
      direction,
      subStepOnly,
      done: finish,
    })
  }

  function runMiniTransition(nextSub) {
    const kf = KEYFRAMES[currentIndex]
    if (!hasTwoStep(kf)) return
    runTransition(currentIndex, currentIndex, kf, { sphereSubStep: nextSub }, true, nextSub >= 1 ? 1 : -1)
  }

  function runToSection(nextIndex) {
    const targetIdx = Math.max(0, Math.min(nextIndex, SECTION_COUNT - 1))
    if (targetIdx === currentIndex) return

    const kf = KEYFRAMES[targetIdx]
    const meta = hasTwoStep(kf) ? { sphereSubStep: 0 } : {}
    runTransition(currentIndex, targetIdx, kf, meta, false)
  }

  function bumpSphereSubStep(nextSub) {
    const kf = KEYFRAMES[currentIndex]
    if (!hasTwoStep(kf)) return
    sphereSubStep = nextSub
    runMiniTransition(nextSub)
  }

  function advance(delta) {
    if (locked) return
    const kf = KEYFRAMES[currentIndex]
    if (hasTwoStep(kf)) {
      if (delta > 0 && sphereSubStep === 0) {
        bumpSphereSubStep(1)
        return
      }
      if (delta > 0 && sphereSubStep === 1) {
        runToSection(currentIndex + 1)
        return
      }
      if (delta < 0 && sphereSubStep === 1) {
        bumpSphereSubStep(0)
        return
      }
      if (delta < 0 && sphereSubStep === 0) {
        runToSection(currentIndex - 1)
        return
      }
    }
    runToSection(currentIndex + delta)
  }

  function requestThrottledNav(delta) {
    if (locked) return
    const now = Date.now()
    if (stepNavLocked || now - lastStepNavAt < STEP_NAV_DELAY_MS) return
    stepNavLocked = true
    lastStepNavAt = now
    advance(delta)
    setTimeout(() => {
      stepNavLocked = false
    }, STEP_NAV_DELAY_MS)
  }

  return {
    refresh: () => {},
    stepBy(delta) {
      if (delta === 0) return
      requestThrottledNav(delta > 0 ? 1 : -1)
    },
    goToIndex(i) {
      const t = Math.max(0, Math.min(i, SECTION_COUNT - 1))
      if (t === currentIndex && hasTwoStep(KEYFRAMES[t]) && sphereSubStep !== 0) {
        bumpSphereSubStep(0)
        return
      }
      if (t === currentIndex) {
        if (locked) return
        locked = true
        gsap.delayedCall(0.35, () => {
          locked = false
        })
        return
      }
      runToSection(t)
    },
    getIndex: () => currentIndex,
    isLocked: () => locked,
  }
}

/** @param {{ goToIndex: (i: number) => void } | null} api */
export function scrollToSection(index, reducedMotion, api) {
  const i = Math.max(0, Math.min(index, SECTION_COUNT - 1))
  if (api?.goToIndex) {
    api.goToIndex(i)
    return
  }
}

export { SECTION_COUNT }
