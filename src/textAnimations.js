import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

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
    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
    })
  }
}

export function bindScrollTriggerResizeRefresh() {
  let t = 0
  const onResize = () => {
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      ScrollTrigger.refresh()
    }, 300)
  }
  window.addEventListener("resize", onResize, { passive: true })
  return () => {
    window.removeEventListener("resize", onResize)
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
 * Pastilles : légère mise à l’échelle selon le panneau visible au scroll (complète `.is-active`).
 * @param {HTMLElement} scrollRootEl
 * @param {HTMLElement[]} dotEls
 */
export function setupDotsScrollFeedback(scrollRootEl, dotEls) {
  const panels = [...scrollRootEl.querySelectorAll(".scroll-panel")]
  const triggers = []
  panels.forEach((panel, i) => {
    const dot = dotEls[i]
    if (!(dot instanceof HTMLElement)) return
    const st = ScrollTrigger.create({
      trigger: panel,
      start: "top 52%",
      end: "bottom 48%",
      onToggle({ isActive }) {
        gsap.to(dot, {
          scale: isActive ? 1.18 : 1,
          opacity: isActive ? 1 : 0.38,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto",
        })
      },
    })
    triggers.push(st)
  })
  return () => triggers.forEach((t) => t.kill())
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
