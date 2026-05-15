import gsap from "gsap"

/**
 * Transition de page « cosmique » : sortie blur + balayage lumineux + entrée élastique.
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

  const veil = root?.querySelector(".page-transition__veil")
  const beam = root?.querySelector(".page-transition__beam")
  const wipeA = root?.querySelector(".page-transition__wipe--a")
  const wipeB = root?.querySelector(".page-transition__wipe--b")
  const flare = root?.querySelector(".page-transition__flare")
  const ring = root?.querySelector(".page-transition__ring")

  const textOut = getTextTargets().filter((el) => el instanceof HTMLElement)

  if (root) root.classList.add("is-active")
  if (stepBadgeEl) stepBadgeEl.textContent = String(toIndex + 1).padStart(2, "0")

  const outX = dir * -42
  const inX = dir * 52
  const mediaOutX = dir * 36
  const mediaInX = dir * -28
  const dur = isIpadLike ? 0.88 : 1.02

  gsap.set([veil, beam, wipeA, wipeB, flare, ring, stepBadgeEl].filter(Boolean), {
    clearProps: "all",
  })
  if (veil) gsap.set(veil, { opacity: 0 })
  if (beam) gsap.set(beam, { xPercent: dir > 0 ? -120 : 120, opacity: 0 })
  if (wipeA) gsap.set(wipeA, { scaleX: 0, transformOrigin: dir > 0 ? "100% 50%" : "0% 50%" })
  if (wipeB) gsap.set(wipeB, { scaleX: 0, transformOrigin: dir > 0 ? "0% 50%" : "100% 50%", opacity: 0.85 })
  if (flare) gsap.set(flare, { scale: 0.4, opacity: 0 })
  if (ring) gsap.set(ring, { scale: 0.5, opacity: 0 })
  if (stepBadgeEl) gsap.set(stepBadgeEl, { scale: 0.6, opacity: 0, y: 12 })

  const tl = gsap.timeline({
    onComplete: () => {
      if (root) root.classList.remove("is-active")
      gsap.set([media, textOverlay, ...getTextTargets()].filter(Boolean), { clearProps: "all" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      done()
    },
  })

  if (textOut.length) {
    tl.to(
      textOut,
      {
        x: outX,
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: dur * 0.28,
        ease: "power3.in",
        stagger: 0.035,
      },
      0
    )
  }

  if (media) {
    tl.to(
      media,
      {
        x: mediaOutX,
        scale: 0.9,
        autoAlpha: 0,
        filter: "blur(8px)",
        duration: dur * 0.3,
        ease: "power3.in",
      },
      0.02
    )
  }

  if (veil) {
    tl.to(veil, { opacity: 1, duration: dur * 0.22, ease: "power2.in" }, dur * 0.14)
    tl.to(veil, { opacity: 0, duration: dur * 0.34, ease: "power2.out" }, dur * 0.52)
  }

  if (beam) {
    tl.fromTo(
      beam,
      { xPercent: dir > 0 ? -130 : 130, opacity: 0, skewX: dir * 8 },
      { xPercent: dir > 0 ? 130 : -130, opacity: 1, skewX: dir * -4, duration: dur * 0.38, ease: "power2.inOut" },
      dur * 0.16
    )
    tl.to(beam, { opacity: 0, duration: dur * 0.12 }, dur * 0.48)
  }

  if (wipeA) {
    tl.to(wipeA, { scaleX: 1, duration: dur * 0.26, ease: "power4.inOut" }, dur * 0.18)
    tl.to(
      wipeA,
      {
        scaleX: 0,
        transformOrigin: dir > 0 ? "0% 50%" : "100% 50%",
        duration: dur * 0.28,
        ease: "power3.inOut",
      },
      dur * 0.48
    )
  }

  if (wipeB) {
    tl.to(wipeB, { scaleX: 1, duration: dur * 0.22, ease: "power4.inOut" }, dur * 0.24)
    tl.to(wipeB, { scaleX: 0, duration: dur * 0.24, ease: "power3.in" }, dur * 0.5)
  }

  if (stepBadgeEl) {
    tl.to(stepBadgeEl, { scale: 1, opacity: 1, y: 0, duration: dur * 0.22, ease: "back.out(2)" }, dur * 0.2)
    tl.to(stepBadgeEl, { opacity: 0, scale: 1.15, duration: dur * 0.2, ease: "power2.in" }, dur * 0.58)
  }

  tl.add(() => {
    applySection()

    const textIn = getTextTargets().filter((el) => el instanceof HTMLElement)
    if (textIn.length) gsap.set(textIn, { x: inX, autoAlpha: 0, filter: "blur(12px)" })
    if (media) gsap.set(media, { x: mediaInX, scale: 1.08, autoAlpha: 0, filter: "blur(10px)" })

    const inners = textOverlay?.querySelectorAll?.(".title-word__inner") ?? []
    if (inners.length) gsap.set(inners, { y: dir * 18, autoAlpha: 0 })

    if (flare) {
      gsap.fromTo(
        flare,
        { scale: 0.2, opacity: 0.95 },
        { scale: 2.4, opacity: 0, duration: dur * 0.45, ease: "power2.out" }
      )
    }
    if (ring) {
      gsap.fromTo(
        ring,
        { scale: 0.35, opacity: 0.85 },
        { scale: 2.8, opacity: 0, duration: dur * 0.5, ease: "power2.out" }
      )
    }
    if (media) {
      gsap.to(media, {
        x: 0,
        scale: 1,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: dur * 0.48,
        ease: "power3.out",
        delay: 0.04,
      })
    }
    if (textIn.length) {
      gsap.to(textIn, {
        x: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: dur * 0.44,
        ease: "power3.out",
        stagger: 0.045,
        delay: 0.06,
      })
    }
    if (inners.length) {
      gsap.to(inners, {
        y: 0,
        autoAlpha: 1,
        duration: dur * 0.38,
        ease: "power3.out",
        stagger: 0.03,
        delay: 0.08,
      })
    }
  }, dur * 0.36)

  tl.to({}, { duration: dur * 0.58 }, dur * 0.36)
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
