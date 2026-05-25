/**
 * Crée le contrôleur de l'overlay d'intro (étoiles + globes scaling vers
 * le sommaire). Toutes les déps sont injectées pour faciliter le découpage.
 *
 * `state` est un objet partagé : `{ active, exited, ready, wireDone, globesPrimed, autoExitTimer }`
 * Tous les flags sont mutables côté module ; les appelants peuvent lire `state.active`
 * et autres pour synchroniser leur logique de navigation.
 */
export function createIntroOverlay({
  gsap,
  motionRef,
  state,
  introStarsFrameEl,
  introTapCatcherEl,
  introAutoExitMs,
  setStarsBackgroundActive,
  scrollToSection,
  getScrollApi,
  snapPageEnterLayerComplete,
}) {
  function clearIntroAutoExitTimer() {
    if (state.autoExitTimer) {
      window.clearTimeout(state.autoExitTimer)
      state.autoExitTimer = 0
    }
  }

  function primeIntroGlobesAndHint() {
    if (state.globesPrimed) return
    state.globesPrimed = true
    document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
      if (!(el instanceof HTMLIFrameElement)) return
      const ds = el.dataset.src
      if (ds && (!el.src || el.src === "about:blank")) el.src = ds
    })
    const hintEl = document.getElementById("scroll-hint")
    if (hintEl instanceof HTMLElement) gsap.set(hintEl, { opacity: 1 })
  }

  function onIntroWindowClick(e) {
    if (!document.body.classList.contains("intro-stars-phase") || state.exited) return
    if (
      e.target instanceof Element &&
      e.target.closest("#nav-dock, #btn-prev, #btn-home, #section-dots, .section-dot, .nav-dock__item")
    ) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    exitIntro()
  }

  function onIntroTouchEnd() {
    if (!document.body.classList.contains("intro-stars-phase") || state.exited) return
    exitIntro()
  }

  function onIntroKeydown(e) {
    if (!document.body.classList.contains("intro-stars-phase") || state.exited) return
    const t = e.target
    if (t && (t.isContentEditable || (t.closest && t.closest("input, textarea, select")))) return
    const introKeysExit =
      e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown"
    if (!introKeysExit) return
    e.preventDefault()
    e.stopPropagation()
    exitIntro()
  }

  function onIntroMessage(e) {
    if (!(introStarsFrameEl instanceof HTMLIFrameElement) || e.source !== introStarsFrameEl.contentWindow) return
    if (e.data === "intro-complete") {
      primeIntroGlobesAndHint()
      state.ready = true
      return
    }
    if (e.data === "intro-tap" || e.data === "intro-complete-tap") {
      if (document.body.classList.contains("intro-stars-phase")) exitIntro()
    }
  }

  function onIntroTapCatcherPointer(e) {
    if (!document.body.classList.contains("intro-stars-phase") || state.exited) return
    if (
      e.target instanceof Element &&
      e.target.closest("#nav-dock, #btn-prev, #btn-home, #section-dots, .section-dot, .nav-dock__item")
    ) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    exitIntro()
  }

  function attachIntroInteractionListeners() {
    window.addEventListener("click", onIntroWindowClick, true)
    window.addEventListener("touchend", onIntroTouchEnd, { passive: true })
    window.addEventListener("keydown", onIntroKeydown, true)
    window.addEventListener("message", onIntroMessage, false)
    if (introTapCatcherEl instanceof HTMLElement) {
      introTapCatcherEl.addEventListener("pointerdown", onIntroTapCatcherPointer, { passive: false })
      introTapCatcherEl.addEventListener("click", onIntroTapCatcherPointer, true)
    }
  }

  function detachIntroInteractionListeners() {
    window.removeEventListener("click", onIntroWindowClick, true)
    window.removeEventListener("touchend", onIntroTouchEnd, { passive: true })
    window.removeEventListener("keydown", onIntroKeydown, true)
    window.removeEventListener("message", onIntroMessage, false)
    if (introTapCatcherEl instanceof HTMLElement) {
      introTapCatcherEl.removeEventListener("pointerdown", onIntroTapCatcherPointer)
      introTapCatcherEl.removeEventListener("click", onIntroTapCatcherPointer, true)
    }
  }

  function exitIntro() {
    if (state.exited) return
    state.exited = true
    clearIntroAutoExitTimer()
    detachIntroInteractionListeners()

    const frame = document.getElementById("intro-stars-frame")
    if (!(frame instanceof HTMLIFrameElement)) {
      state.active = false
      document.body.classList.remove("intro-stars-phase")
      document.body.style.overflow = ""
      setStarsBackgroundActive(true)
      const namesOnly = document.getElementById("persistent-names")
      if (namesOnly instanceof HTMLElement) {
        gsap.set(namesOnly, { opacity: 1 })
        namesOnly.setAttribute("aria-hidden", "false")
      }
      return
    }

    try {
      frame.contentWindow?.IntroStars?.exit?.()
    } catch (e) {
      if (import.meta.env?.DEV) console.warn(e)
    }

    document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
      if (!(el instanceof HTMLIFrameElement)) return
      const ds = el.dataset.src
      if (ds && (!el.src || el.src === "about:blank")) el.src = ds
    })

    snapPageEnterLayerComplete()

    const clipFrames = () => [...document.querySelectorAll("#intro-clips-wrap iframe.intro-clip-frame")]

    const frames = clipFrames()
    if (frames.length) {
      gsap.set(frames, { transformOrigin: "center center", scale: 0.05 })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gsap.to(frames, { scale: 1, duration: 1.2, ease: "expo.out" })
        })
      })
    }

    const hint = document.getElementById("scroll-hint")
    if (hint instanceof HTMLElement) gsap.to(hint, { opacity: 0, duration: 0.3, ease: "power1.out" })

    gsap.to(frame, {
      opacity: 0,
      duration: 0.8,
      ease: "power1.inOut",
      delay: 0.1,
      onComplete: () => {
        frame.remove()
        document.body.classList.remove("intro-stars-phase")
        document.body.style.overflow = ""

        setStarsBackgroundActive(true)
        state.active = false

        const names = document.getElementById("persistent-names")
        if (names instanceof HTMLElement) {
          gsap.to(names, { opacity: 1, duration: 0.4, ease: "power1.out" })
          names.setAttribute("aria-hidden", "false")
        }

        const hintAfter = document.getElementById("scroll-hint")
        if (hintAfter instanceof HTMLElement) {
          gsap.to(hintAfter, { opacity: 1, duration: 0.4, ease: "power1.out" })
        }
      },
    })

    scrollToSection(0, motionRef.reduced, getScrollApi())
  }

  function initIntroStarsOverlay() {
    const frame = document.getElementById("intro-stars-frame")
    if (!(frame instanceof HTMLIFrameElement)) {
      state.active = false
      state.exited = true
      return
    }

    state.active = true
    state.exited = false
    state.ready = false
    state.globesPrimed = false
    document.body.classList.add("intro-stars-phase")
    document.body.style.overflow = "hidden"

    const clipFrames = () => [...document.querySelectorAll("#intro-clips-wrap iframe.intro-clip-frame")]

    const initialFrames = clipFrames()
    if (initialFrames.length) {
      gsap.set(initialFrames, { transformOrigin: "center center", scale: 0.05 })
    }

    function wireIntroReady() {
      if (state.wireDone) return
      state.wireDone = true
      const api = frame.contentWindow?.IntroStars
      const scheduleAutoExit = () => {
        clearIntroAutoExitTimer()
        state.autoExitTimer = window.setTimeout(() => {
          state.autoExitTimer = 0
          if (!state.exited) exitIntro()
        }, introAutoExitMs)
      }
      if (api && typeof api.onComplete === "function") {
        let done = false
        api.onComplete(() => {
          if (done) return
          done = true
          primeIntroGlobesAndHint()
          state.ready = true
          scheduleAutoExit()
        })
      } else {
        primeIntroGlobesAndHint()
        state.ready = true
        scheduleAutoExit()
      }
    }

    if (frame.contentDocument?.readyState === "complete") queueMicrotask(wireIntroReady)
    else frame.addEventListener("load", () => queueMicrotask(wireIntroReady), { once: true })

    attachIntroInteractionListeners()
  }

  return {
    state,
    initIntroStarsOverlay,
    exitIntro,
    primeIntroGlobesAndHint,
    clearIntroAutoExitTimer,
  }
}
