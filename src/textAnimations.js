import gsap from "gsap"

/** iPad / iPadOS (Safari « desktop »). */
export function detectIpadLike() {
  return (
    /iPad/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

/**
 * @param {{ reducedMotion: boolean, isIpad: boolean }} opts
 */
export function configureGsapPerformance(opts) {
  if (opts.reducedMotion) return
  if (opts.isIpad) {
    gsap.ticker.fps(30)
    gsap.config({ force3D: true })
  }
}

/** Debounce léger au redimensionnement (sans ScrollTrigger). */
export function bindViewportResizeDebounced(onResize) {
  let t = 0
  const fn = () => {
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      onResize()
    }, 300)
  }
  window.addEventListener("resize", fn, { passive: true })
  return () => {
    window.removeEventListener("resize", fn)
    window.clearTimeout(t)
  }
}

/**
 * Entrées discrètes au chargement (header crédits + pastilles).
 * @param {{ reducedMotion: boolean }} opts
 */
export function initLayoutEntranceAnimations(opts) {
  if (opts.reducedMotion) return
  const header = document.querySelector(".intro-page-meta")
  const dots = document.getElementById("section-dots")
  if (header instanceof HTMLElement) {
    gsap.fromTo(
      header,
      { y: -36, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.78, ease: "power3.out", delay: 0.12 }
    )
  }
  if (dots instanceof HTMLElement) {
    gsap.fromTo(
      dots,
      { x: 40, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.78, ease: "power3.out", delay: 0.2 }
    )
  }
}

/**
 * Pastilles : état visuel selon l’étape active (plus de ScrollTrigger).
 * @param {number} activeIndex
 * @param {HTMLElement[]} dotEls
 * @param {{ reducedMotion?: boolean }} [opts]
 */
export function updateDotsVisualState(activeIndex, dotEls, opts = {}) {
  const instant = !!opts.reducedMotion
  dotEls.forEach((dot) => {
    if (!(dot instanceof HTMLElement)) return
    const dotIdx = Number.parseInt(dot.dataset.section ?? "", 10)
    const active = dotIdx === activeIndex
    if (instant) {
      gsap.set(dot, { scale: active ? 1.18 : 1, opacity: active ? 1 : 0.38 })
    } else {
      gsap.to(dot, {
        scale: active ? 1.18 : 1,
        opacity: active ? 1 : 0.38,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      })
    }
  })
}

/**
 * Micro-interactions souris sur les pastilles (éléments stables dans le DOM).
 */
export function setupFinePointerHoverNudges() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {}

  const clickables = [...document.querySelectorAll(".section-dot")]
  const cleanups = clickables.map((el) => {
    const enter = () => gsap.to(el, { scale: 1.06, duration: 0.2, ease: "power2.out", overwrite: "auto" })
    const leave = () => gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.out", overwrite: "auto" })
    el.addEventListener("mouseenter", enter)
    el.addEventListener("mouseleave", leave)
    return () => {
      el.removeEventListener("mouseenter", enter)
      el.removeEventListener("mouseleave", leave)
    }
  })

  return () => cleanups.forEach((fn) => fn())
}
