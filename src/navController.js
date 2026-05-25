import { canNavigate, withNavLock } from "./navHelpers.js"
import { isEpilogueKeyframe } from "./sections.js"
import { scrollToSection } from "./scroll.js"

/**
 * Crée le contrôleur de navigation : avance/recul, gestes, sommaire.
 * Toutes les dépendances mutables sont fournies via getters.
 */
export function createNavController({
  navState,
  navDelayMs,
  motionRef,
  KEYFRAMES,
  STEP_ANIMATIONS,
  presentationEndState,
  getScrollApi,
  getIntroActive,
  getCurrentKeyframe,
  getSectionAnimClickIndex,
  setSectionAnimClickIndex,
  resetSectionAnimClickIndex,
  playBackNavAnimation,
}) {
  function goToNextStep() {
    getScrollApi()?.stepBy(1)
  }

  function goToPrevStep() {
    getScrollApi()?.stepBy(-1)
  }

  function currentSectionUsesScrollTwoStep() {
    const kf = getCurrentKeyframe()
    return !!(kf?.sphereTwoStep || kf?.eratoTwoStep)
  }

  function goToSectionIndex(index) {
    if (getIntroActive() || presentationEndState.ended || presentationEndState.ending) return
    if (!canNavigate(navState, navDelayMs)) return
    withNavLock(navState, navDelayMs, () => {
      resetSectionAnimClickIndex()
      scrollToSection(index, motionRef.reduced, getScrollApi())
    })
  }

  function tryAdvanceForwardFromUserGesture() {
    if (!canNavigate(navState, navDelayMs)) return
    if (presentationEndState.ended || presentationEndState.ending) return

    const scrollApi = getScrollApi()
    const idx = scrollApi?.getIndex?.() ?? 0

    if (isEpilogueKeyframe(KEYFRAMES[idx])) return

    if (idx === 0) {
      withNavLock(navState, navDelayMs, goToNextStep)
      return
    }

    if (currentSectionUsesScrollTwoStep()) {
      withNavLock(navState, navDelayMs, goToNextStep)
      return
    }

    const anims = STEP_ANIMATIONS[idx] || []
    const animIdx = getSectionAnimClickIndex()

    if (animIdx < anims.length) {
      withNavLock(navState, navDelayMs, () => {
        const fn = anims[animIdx]
        if (typeof fn === "function") fn()
        setSectionAnimClickIndex(animIdx + 1)
      })
      return
    }

    withNavLock(navState, navDelayMs, () => {
      setSectionAnimClickIndex(0)
      goToNextStep()
    })
  }

  function triggerBackwardNav() {
    if (getIntroActive() || presentationEndState.ended || presentationEndState.ending) return
    if (!canNavigate(navState, navDelayMs)) return
    navState.locked = true
    navState.lastTime = Date.now()
    resetSectionAnimClickIndex()
    playBackNavAnimation(() => {
      goToPrevStep()
      window.setTimeout(() => {
        navState.locked = false
      }, navDelayMs)
    })
  }

  function handleNav(direction = "forward") {
    if (getIntroActive()) return
    if (!canNavigate(navState, navDelayMs)) return
    if (direction === "backward") {
      triggerBackwardNav()
      return
    }
    tryAdvanceForwardFromUserGesture()
  }

  function targetExcludesGlobalNav(el) {
    if (!(el instanceof Element)) return true
    if (el.isContentEditable || el.closest("[contenteditable]")) return true
    return !!el.closest(
      '#nav-dock, #btn-home, #section-dots, #btn-prev, .nav-dock__item, .nav-dock__earth-frame, .section-dot, .nav-dot, .nav-btn, button[data-nav], a, button, [role="button"], input, textarea, select, label, iframe, #quiz-frame'
    )
  }

  function onGlobalClickNav(e) {
    if (targetExcludesGlobalNav(e.target)) return
    handleNav("forward")
  }

  let touchStartX = 0
  let touchStartY = 0

  function onTouchStartNav(e) {
    if (e.touches.length !== 1) return
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  function onTouchEndNav(e) {
    if (!e.changedTouches.length) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist >= 15) return
    if (targetExcludesGlobalNav(t.target)) return
    handleNav("forward")
  }

  return {
    goToNextStep,
    goToPrevStep,
    goToSectionIndex,
    tryAdvanceForwardFromUserGesture,
    triggerBackwardNav,
    handleNav,
    targetExcludesGlobalNav,
    onGlobalClickNav,
    onTouchStartNav,
    onTouchEndNav,
  }
}
