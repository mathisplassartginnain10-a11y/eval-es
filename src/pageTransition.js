import gsap from "gsap"
import { runHyperspaceWarp } from "./starsBg.js"

const HYPERSPACE_SEC = 1

/**
 * Transition de page : hyperspace (étoiles warp) + cut net + entrée contenu.
 * @param {{
 *   direction?: number,
 *   subStepOnly?: boolean,
 *   reducedMotion?: boolean,
 *   toIndex?: number,
 *   applySection: () => void,
 *   done: () => void,
 *   getTextTargets: () => HTMLElement[],
 *   stageMediaWrap: HTMLElement | null,
 *   textOverlay: HTMLElement | null,
 *   transitionRoot: HTMLElement | null,
 *   stepBadgeEl: HTMLElement | null,
 *   isIpadLike?: boolean,
 * }} opts
 */
export function runPageTransition(opts) {
  const {
    direction = 1,
    subStepOnly = false,
    reducedMotion = false,
    toIndex = 0,
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
  const root = transitionRoot instanceof HTMLElement ? transitionRoot : null

  if (reducedMotion) {
    applySection()
    if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    if (media) gsap.set(media, { autoAlpha: 1, clearProps: "all" })
    gsap.set(getTextTargets(), { autoAlpha: 1, clearProps: "all" })
    if (root) root.classList.remove("is-active")
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

  runHyperspaceTransition({
    dir,
    toIndex,
    applySection,
    done,
    getTextTargets,
    media,
    textOverlay,
    root,
    stepBadgeEl,
    isIpadLike,
  })
}

function runHyperspaceTransition({
  dir,
  toIndex,
  applySection,
  done,
  getTextTargets,
  media,
  textOverlay,
  root,
  stepBadgeEl,
  isIpadLike,
}) {
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)
  const inX = dir * 40
  const mediaInX = dir * -22
  const enterDur = isIpadLike ? 0.38 : 0.45

  if (root) root.classList.add("is-active")
  if (stepBadgeEl) stepBadgeEl.textContent = String(toIndex + 1).padStart(2, "0")

  gsap.killTweensOf([media, textOverlay, ...textOut, root, stepBadgeEl].filter(Boolean))

  if (stepBadgeEl) gsap.set(stepBadgeEl, { scale: 0.7, opacity: 0, y: 8 })

  const tl = gsap.timeline()

  if (textOut.length) {
    tl.to(
      textOut,
      {
        x: dir * -28,
        autoAlpha: 0,
        filter: "blur(8px)",
        duration: 0.14,
        ease: "power3.in",
        stagger: 0.02,
      },
      0
    )
  }

  if (media) {
    tl.to(
      media,
      {
        scale: 0.94,
        autoAlpha: 0,
        filter: "blur(6px)",
        duration: 0.16,
        ease: "power3.in",
      },
      0
    )
  }

  tl.add(() => {
    runHyperspaceWarp({
      durationSec: HYPERSPACE_SEC,
      onCut: () => {
        applySection()

        if (stepBadgeEl) {
          gsap.fromTo(
            stepBadgeEl,
            { scale: 0.85, opacity: 0.95, y: 0 },
            { scale: 1.12, opacity: 0, duration: 0.28, ease: "power2.out" }
          )
        }

        const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
        if (textIn.length) gsap.set(textIn, { x: inX, autoAlpha: 0, filter: "blur(10px)" })
        if (media) gsap.set(media, { x: mediaInX, scale: 1.05, autoAlpha: 0, filter: "blur(8px)" })

        const inners = textOverlay?.querySelectorAll?.(".title-word__inner") ?? []
        if (inners.length) gsap.set(inners, { y: dir * 14, autoAlpha: 0 })

        if (media) {
          gsap.to(media, {
            x: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: enterDur,
            ease: "power3.out",
            delay: 0.06,
          })
        }
        if (textIn.length) {
          gsap.to(textIn, {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: enterDur,
            ease: "power3.out",
            stagger: 0.04,
            delay: 0.1,
          })
        }
        if (inners.length) {
          gsap.to(inners, {
            y: 0,
            autoAlpha: 1,
            duration: enterDur * 0.9,
            ease: "power3.out",
            stagger: 0.028,
            delay: 0.12,
          })
        }
      },
      onComplete: () => {
        gsap.delayedCall(enterDur + 0.22, () => {
          if (root) root.classList.remove("is-active")
          gsap.set([media, textOverlay, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
          if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
          done()
        })
      },
    })
  }, 0.1)
}

function runMiniTransition({ dir, applySection, done, getTextTargets, media, textOverlay, isIpadLike }) {
  const dur = isIpadLike ? 0.34 : 0.42
  const outX = dir * -22
  const inX = dir * 22
  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([media, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      done()
    },
  })

  if (textOut.length) {
    tl.to(textOut, { x: outX, autoAlpha: 0, duration: dur * 0.4, ease: "power2.in", stagger: 0.02 }, 0)
  }
  if (media) {
    tl.to(media, { scale: 0.96, autoAlpha: 0, duration: dur * 0.42, ease: "power2.in" }, 0)
  }

  tl.add(() => {
    applySection()
    const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
    if (textIn.length) gsap.set(textIn, { x: inX, autoAlpha: 0 })
    if (media) gsap.set(media, { scale: 1.03, autoAlpha: 0 })

    if (media) {
      gsap.to(media, { scale: 1, autoAlpha: 1, duration: dur * 0.55, ease: "power2.out" })
    }
    if (textIn.length) {
      gsap.to(textIn, { x: 0, autoAlpha: 1, duration: dur * 0.5, ease: "power2.out", stagger: 0.025, delay: 0.04 })
    }
  }, dur * 0.38)

  tl.to({}, { duration: dur * 0.55 }, dur * 0.38)
}
