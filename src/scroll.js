import gsap from "gsap"
import { KEYFRAMES, SECTION_COUNT } from "./sections.js"

const ANIM_DURATION_S = 0.025
const PAUSE_AFTER_MS = 20
const SWIPE_PX = 60
const WHEEL_ACCUM_PX = 60

export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Navigation une étape à la fois (molette, swipe, clavier via main).
 * Verrou court pendant la transition — les médias sont pilotés dans les callbacks.
 */
export function initScroll({ reducedMotion, onTransitionStart, onTransitionComplete, onProgressUi }) {
  let currentIndex = 0
  let locked = false
  let wheelSum = 0
  let touchY0 = 0
  /** @type { gsap.core.Timeline | null } */
  let timeline = null

  const tick = { _: 0 }

  function setBodyLock(on) {
    document.body.classList.toggle("scroll-locked", on)
  }

  function syncScrollDom(index) {
    const panels = document.querySelectorAll("#scroll-root .scroll-panel")
    const p = panels[index]
    if (p) window.scrollTo({ top: p.offsetTop, behavior: "auto" })
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
    wheelSum = 0
    setBodyLock(true)
    if (timeline) timeline.kill()

    onTransitionStart(targetIdx, kf)
    onProgressUi(targetIdx)

    tick._ = 0
    timeline = gsap.timeline({
      defaults: { duration: dur, ease: "power3.inOut" },
      onComplete: () => {
        currentIndex = targetIdx
        gsap.delayedCall(pauseMs / 1000, () => {
          locked = false
          setBodyLock(false)
          syncScrollDom(targetIdx)
          onTransitionComplete(targetIdx, kf)
        })
      }
    })
    timeline.to(tick, { _: 1 }, 0)
  }

  function onWheel(e) {
    if (locked) {
      e.preventDefault()
      return
    }
    wheelSum += e.deltaY
    if (wheelSum >= WHEEL_ACCUM_PX) {
      wheelSum = 0
      runToSection(currentIndex + 1)
    } else if (wheelSum <= -WHEEL_ACCUM_PX) {
      wheelSum = 0
      runToSection(currentIndex - 1)
    }
  }

  window.addEventListener("wheel", onWheel, { passive: false })

  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches[0]) touchY0 = e.touches[0].clientY
    },
    { passive: true }
  )

  window.addEventListener(
    "touchend",
    (e) => {
      if (locked || !e.changedTouches[0]) return
      const dy = touchY0 - e.changedTouches[0].clientY
      if (dy > SWIPE_PX) runToSection(currentIndex + 1)
      else if (dy < -SWIPE_PX) runToSection(currentIndex - 1)
    },
    { passive: true }
  )

  return {
    refresh: () => syncScrollDom(currentIndex),
    stepBy(delta) {
      if (locked) return
      runToSection(currentIndex + delta)
    },
    goToIndex(i) {
      runToSection(i)
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
  const panels = document.querySelectorAll("#scroll-root .scroll-panel")
  const p = panels[i]
  const y = p ? p.offsetTop : i * window.innerHeight
  window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" })
}

export { SECTION_COUNT }
