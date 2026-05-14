import gsap from "gsap"
import { KEYFRAMES, SECTION_COUNT } from "./sections.js"

const ANIM_DURATION_S = 0.025
/** Pause après une transition GSAP avant de déverrouiller la navigation suivante. */
const PAUSE_AFTER_MS = 500
/** Entre deux navigations déclenchées par clic / tap / clavier (une étape max par fenêtre). */
const STEP_NAV_DELAY_MS = 500

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
 * Navigation une étape à la fois via `stepBy` (clic / tap / clavier dans `main.js`).
 * Throttle ~500 ms. Pas de molette ni scroll pour changer d’étape.
 * `onTransitionStart` / `onTransitionComplete` : 3ᵉ argument `{ sphereSubStep?, subStepOnly? }` pour `sphereTwoStep` / `eratoTwoStep`.
 */
export function initScroll({ reducedMotion, onTransitionStart, onTransitionComplete, onProgressUi }) {
  let currentIndex = 0
  /** Sur un panneau à deux temps : 0 = état d’arrivée, 1 = animation / iframe */
  let sphereSubStep = 0
  let locked = false
  let lastStepNavAt = 0
  let stepNavLocked = false
  /** @type { gsap.core.Timeline | null } */
  let timeline = null

  const tick = { _: 0 }

  function setBodyLock(on) {
    document.body.classList.toggle("scroll-locked", on)
  }

  function syncScrollDom(_index) {
    /* Pas de scroll natif : les panneaux `#scroll-root` servent d’ancres sémantiques uniquement. */
  }

  function runMiniTransition(index, kf, meta) {
    const dur = reducedMotion ? 0.01 : ANIM_DURATION_S
    const pauseMs = reducedMotion ? 0 : PAUSE_AFTER_MS

    locked = true
    setBodyLock(true)
    if (timeline) timeline.kill()

    onTransitionStart(index, kf, { ...meta, subStepOnly: true })
    onProgressUi(index)

    tick._ = 0
    timeline = gsap.timeline({
      defaults: { duration: dur, ease: "power3.inOut" },
      onComplete: () => {
        gsap.delayedCall(pauseMs / 1000, () => {
          locked = false
          setBodyLock(false)
          syncScrollDom(index)
          onTransitionComplete(index, kf, { ...meta, subStepOnly: true })
        })
      }
    })
    timeline.to(tick, { _: 1 }, 0)
  }

  function runToSection(nextIndex) {
    if (locked) return
    const n = SECTION_COUNT
    const targetIdx = Math.max(0, Math.min(nextIndex, n - 1))
    if (targetIdx === currentIndex) return

    const kf = KEYFRAMES[targetIdx]
    const dur = reducedMotion ? 0.01 : ANIM_DURATION_S
    const pauseMs = reducedMotion ? 0 : PAUSE_AFTER_MS

    locked = true
    setBodyLock(true)
    if (timeline) timeline.kill()

    sphereSubStep = 0
    const meta = hasTwoStep(kf) ? { sphereSubStep: 0 } : {}
    onTransitionStart(targetIdx, kf, meta)
    onProgressUi(targetIdx)

    tick._ = 0
    timeline = gsap.timeline({
      defaults: { duration: dur, ease: "power3.inOut" },
      onComplete: () => {
        currentIndex = targetIdx
        if (hasTwoStep(kf)) sphereSubStep = 0
        gsap.delayedCall(pauseMs / 1000, () => {
          locked = false
          setBodyLock(false)
          syncScrollDom(targetIdx)
          onTransitionComplete(targetIdx, kf, meta)
        })
      }
    })
    timeline.to(tick, { _: 1 }, 0)
  }

  function bumpSphereSubStep(nextSub) {
    const kf = KEYFRAMES[currentIndex]
    if (!hasTwoStep(kf)) return
    sphereSubStep = nextSub
    runMiniTransition(currentIndex, kf, { sphereSubStep: nextSub })
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
    refresh: () => syncScrollDom(currentIndex),
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
      /* Même index (ex. fin intro étoiles → étape 0 déjà active) : court verrou pour absorber les entrées résiduelles */
      if (t === currentIndex) {
        if (locked) return
        locked = true
        if (timeline) timeline.kill()
        timeline = null
        gsap.delayedCall(0.35, () => {
          locked = false
        })
        return
      }
      runToSection(t)
    },
    getIndex: () => currentIndex,
    isLocked: () => locked
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
