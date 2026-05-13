import gsap from "gsap"
import { KEYFRAMES, SECTION_COUNT } from "./sections.js"

const ANIM_DURATION_S = 0.025
const PAUSE_AFTER_MS = 20
const WHEEL_ACCUM_PX = 60
/** Seuil vertical (px) — min absolu + fraction de la hauteur d’écran (meilleur sur grands écrans / trackpad tactile). */
function swipeThresholdPx() {
  return Math.max(52, Math.min(110, window.innerHeight * 0.09))
}
/** Après une navigation déclenchée au doigt, court silence pour éviter double déclenchement (iOS / multi-touch). */
const TOUCH_NAV_COOLDOWN_MS = 320

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
 * Navigation une étape à la fois (molette, swipe, clavier via main).
 * Swipe tactile : suivi par identifiant de doigt, rejet du geste majoritairement horizontal, pastilles latérales exclues (`#section-dots`), `touchcancel`, anti double-frappe court. Les iframes ne remontent pas les touches : bandes `.intro-clip-swipe-rail--start|end` et `.erato-swipe-rail--start|end` au-dessus ; le canvas sphère reste en `pointer-events: none`.
 * Verrou court pendant la transition — les médias sont pilotés dans les callbacks.
 * `onTransitionStart` / `onTransitionComplete` reçoivent un 3ᵉ argument optionnel `{ sphereSubStep?, subStepOnly? }` sur les panneaux à deux temps (`sphereTwoStep`, `eratoTwoStep`). `subStepOnly: true` = changement de sous-étape sans changement de page (pas d’animation d’entrée globale).
 */
export function initScroll({ reducedMotion, onTransitionStart, onTransitionComplete, onProgressUi }) {
  let currentIndex = 0
  /** Sur un panneau à deux temps : 0 = état d’arrivée, 1 = animation / iframe */
  let sphereSubStep = 0
  let locked = false
  let wheelSum = 0
  /** @type {{ id: number; y0: number; x0: number; ignore: boolean } | null} */
  let touchGesture = null
  let lastTouchNavAt = 0
  /** @type { gsap.core.Timeline | null } */
  let timeline = null

  const tick = { _: 0 }

  function setBodyLock(on) {
    document.body.classList.toggle("scroll-locked", on)
  }

  function syncScrollDom(index) {
    const root = document.getElementById("scroll-root")
    const p = root?.children[index]
    if (p instanceof HTMLElement) window.scrollTo({ top: p.offsetTop, behavior: "auto" })
  }

  function runMiniTransition(index, kf, meta) {
    const dur = reducedMotion ? 0.01 : ANIM_DURATION_S
    const pauseMs = reducedMotion ? 0 : PAUSE_AFTER_MS

    locked = true
    wheelSum = 0
    touchGesture = null
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
          onTransitionComplete(index, kf, meta)
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
    wheelSum = 0
    touchGesture = null
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

  function targetIsDotsScroller(el) {
    return !!(el && typeof el.closest === "function" && el.closest("#section-dots"))
  }

  function onWheel(e) {
    if (locked) {
      e.preventDefault()
      return
    }
    const dy = e.deltaY
    if (dy > 0 && wheelSum < 0) wheelSum = 0
    else if (dy < 0 && wheelSum > 0) wheelSum = 0
    wheelSum += dy
    if (wheelSum >= WHEEL_ACCUM_PX) {
      wheelSum = 0
      advance(1)
    } else if (wheelSum <= -WHEEL_ACCUM_PX) {
      wheelSum = 0
      advance(-1)
    }
  }

  window.addEventListener("wheel", onWheel, { passive: false })

  function touchById(e, id) {
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === id) return e.touches[i]
    }
    return null
  }

  function onTouchStart(e) {
    if (locked) {
      touchGesture = null
      return
    }
    if (targetIsDotsScroller(/** @type {EventTarget | null} */ (e.target))) {
      touchGesture = null
      return
    }
    if (e.touches.length !== 1) {
      touchGesture = null
      return
    }
    const t = e.touches[0]
    touchGesture = { id: t.identifier, y0: t.clientY, x0: t.clientX, ignore: false }
  }

  function onTouchMove(e) {
    if (!touchGesture || touchGesture.ignore) return
    const t = touchById(e, touchGesture.id)
    if (!t) {
      touchGesture = null
      return
    }
    const dx = t.clientX - touchGesture.x0
    const dy = t.clientY - touchGesture.y0
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    if (ax > 14 && ax > ay * 1.15) {
      touchGesture.ignore = true
      return
    }
    if (ay > 10 && ay > ax * 1.05) {
      e.preventDefault()
    }
  }

  function finishTouchFromChanged(e) {
    if (!touchGesture || touchGesture.ignore) {
      touchGesture = null
      return
    }
    if (locked) {
      touchGesture = null
      return
    }
    let ended = null
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchGesture.id) {
        ended = e.changedTouches[i]
        break
      }
    }
    if (!ended) return
    const dy = touchGesture.y0 - ended.clientY
    const dx = ended.clientX - touchGesture.x0
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      touchGesture = null
      return
    }
    const th = swipeThresholdPx()
    touchGesture = null
    if (dy > th || dy < -th) {
      const now = Date.now()
      if (now - lastTouchNavAt < TOUCH_NAV_COOLDOWN_MS) return
      lastTouchNavAt = now
      advance(dy > th ? 1 : -1)
    }
  }

  function onTouchEnd(e) {
    finishTouchFromChanged(e)
  }

  function onTouchCancel() {
    touchGesture = null
  }

  function resetTouchAfterLayout() {
    touchGesture = null
    wheelSum = 0
  }

  document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })
  document.addEventListener("touchend", onTouchEnd, { passive: true, capture: true })
  document.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true })

  window.addEventListener("resize", resetTouchAfterLayout, { passive: true })
  window.addEventListener("orientationchange", resetTouchAfterLayout, { passive: true })
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") resetTouchAfterLayout()
  })

  return {
    refresh: () => syncScrollDom(currentIndex),
    stepBy(delta) {
      if (locked) return
      advance(delta)
    },
    goToIndex(i) {
      const t = Math.max(0, Math.min(i, SECTION_COUNT - 1))
      if (t === currentIndex && hasTwoStep(KEYFRAMES[t]) && sphereSubStep !== 0) {
        bumpSphereSubStep(0)
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
  const root = document.getElementById("scroll-root")
  const p = root?.children[i]
  const y = p instanceof HTMLElement ? p.offsetTop : i * window.innerHeight
  window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" })
}

export { SECTION_COUNT }
