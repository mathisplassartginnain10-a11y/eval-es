import { show, hide } from "./domHelpers.js"
import { isEpilogueKeyframe } from "./sections.js"

/**
 * Construit l'API « fin de présentation » :
 * fondu au noir + bouton Sommaire géant + retour propre vers le sommaire.
 */
export function createPresentationEnd({
  gsap,
  motionRef,
  MOTION,
  textOverlay,
  epilogueActions,
  btnEndPresentation,
  presentationBlackout,
  navDock,
  navDockSep,
  btnPrev,
  KEYFRAMES,
  state,
  postToNavDockEarth,
  restartStarsAfterFinale,
  getScrollApi,
  applySlideForIndex,
  applyTextForSection,
  updateUi,
  updateScrollHint,
  resetSectionAnimClickIndex,
  primePageEnterHidden,
  triggerPageEnterEffects,
}) {

  function showPresentationEndSommaire() {
    if (btnPrev instanceof HTMLButtonElement) btnPrev.hidden = true
    if (navDockSep instanceof HTMLElement) navDockSep.hidden = true

    if (navDock instanceof HTMLElement) {
      navDock.hidden = false
      navDock.classList.add("is-visible", "nav-dock--end-only")
      navDock.setAttribute("aria-hidden", "false")

      if (motionRef.reduced) {
        gsap.set(navDock, { autoAlpha: 1, scale: 1, clearProps: "transform" })
      } else {
        gsap.fromTo(
          navDock,
          { autoAlpha: 0, scale: 0.85, y: 18 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            delay: 0.15,
            ease: MOTION.ease.settle,
            clearProps: "transform",
          }
        )
      }
    }
    postToNavDockEarth("resume")
  }

  function returnToSommaireFromEnd() {
    if (!state.ended) return

    state.ended = false
    document.body.classList.remove("presentation-ended")

    if (presentationBlackout instanceof HTMLElement) {
      gsap.killTweensOf(presentationBlackout)
      hide(presentationBlackout)
      gsap.set(presentationBlackout, { clearProps: "opacity" })
    }

    if (navDock instanceof HTMLElement) {
      gsap.killTweensOf(navDock)
      navDock.classList.remove("nav-dock--end-only", "is-visible")
      navDock.hidden = true
      gsap.set(navDock, { clearProps: "all" })
    }
    if (btnPrev instanceof HTMLButtonElement) btnPrev.hidden = false
    if (navDockSep instanceof HTMLElement) navDockSep.hidden = false
    if (btnEndPresentation instanceof HTMLButtonElement) btnEndPresentation.disabled = false
    if (epilogueActions instanceof HTMLElement) {
      hide(epilogueActions)
      gsap.set(epilogueActions, { clearProps: "all" })
    }

    restartStarsAfterFinale()

    const scrollApi = getScrollApi()
    const kf = KEYFRAMES[0]
    scrollApi?.jumpToIndex?.(0)
    applySlideForIndex(0, {})
    applyTextForSection(kf.textSection)
    updateUi(0)
    resetSectionAnimClickIndex()
    if (!motionRef.reduced) primePageEnterHidden(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => triggerPageEnterEffects())
    })
  }

  async function revealPresentationEnd() {
    if (state.ended || state.ending) return
    const scrollApi = getScrollApi()
    const idx = scrollApi?.getIndex?.() ?? -1
    if (!isEpilogueKeyframe(KEYFRAMES[idx])) return

    state.ending = true
    if (btnEndPresentation instanceof HTMLButtonElement) btnEndPresentation.disabled = true
    document.body.classList.add("presentation-ending", "scroll-locked")

    const fadeTargets = [textOverlay, epilogueActions].filter(Boolean)
    gsap.killTweensOf(fadeTargets)
    if (fadeTargets.length) {
      if (motionRef.reduced) {
        gsap.set(fadeTargets, { autoAlpha: 0 })
      } else {
        await new Promise((resolve) => {
          gsap.to(fadeTargets, {
            autoAlpha: 0,
            duration: 0.4,
            ease: MOTION.ease.in,
            onComplete: resolve,
          })
        })
      }
    }

    if (presentationBlackout instanceof HTMLElement) {
      show(presentationBlackout)
      if (motionRef.reduced) {
        gsap.set(presentationBlackout, { opacity: 1 })
      } else {
        await new Promise((resolve) => {
          gsap.fromTo(
            presentationBlackout,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.7,
              ease: MOTION.ease.in,
              onComplete: resolve,
            }
          )
        })
      }
    }

    state.ending = false
    state.ended = true
    document.body.classList.remove("presentation-ending", "scroll-locked")
    document.body.classList.add("presentation-ended")
    showPresentationEndSommaire()
    updateScrollHint(idx)
  }

  return {
    state,
    isEnded: () => state.ended,
    isEnding: () => state.ending,
    revealPresentationEnd,
    returnToSommaireFromEnd,
    showPresentationEndSommaire,
  }
}
