import { postToFrameById } from "./iframeHelpers.js"
import { isEpilogueKeyframe } from "./sections.js"

export function postToNavDockEarth(msg) {
  postToFrameById("nav-dock-earth-frame", msg)
}

export function createNavDockController({ gsap, motionRef, MOTION, navDock, btnPrev, btnHome, KEYFRAMES, getIntroActive }) {
  function updateNavDock(sectionIndex) {
    const visible =
      sectionIndex > 0 &&
      !isEpilogueKeyframe(KEYFRAMES[sectionIndex]) &&
      !getIntroActive() &&
      !document.body.classList.contains("intro-stars-phase")
    if (navDock instanceof HTMLElement) {
      navDock.classList.toggle("is-visible", visible)
      navDock.hidden = !visible
    }
    postToNavDockEarth(visible ? "resume" : "pause")
  }

  function playBackNavAnimation(onComplete) {
    if (!(btnPrev instanceof HTMLButtonElement) || motionRef.reduced) {
      onComplete()
      return
    }

    const glyph = btnPrev.querySelector(".nav-dock__glyph")
    const badge = btnPrev.querySelector(".nav-dock__glyph--badge")
    const targets = [btnPrev, glyph, badge].filter(Boolean)
    btnPrev.classList.add("is-animating")
    gsap.killTweensOf(targets)

    const tl = gsap.timeline({
      onComplete: () => {
        btnPrev.classList.remove("is-animating")
        if (glyph) gsap.set(glyph, { clearProps: "transform,opacity,filter" })
        if (badge instanceof HTMLElement) gsap.set(badge, { clearProps: "box-shadow,transform" })
        onComplete()
      },
    })

    tl.to(glyph, { x: -4, rotate: 52, opacity: 0.5, duration: 0.18, ease: MOTION.ease.in }, 0)
    if (badge instanceof HTMLElement) {
      tl.to(
        badge,
        {
          boxShadow: "0 0 22px rgba(74, 158, 255, 0.55), 0 0 40px rgba(122, 184, 255, 0.25)",
          scale: 1.08,
          duration: 0.18,
          ease: "sine.out",
        },
        0.04
      )
    }
    tl.to(glyph, { x: 0, rotate: 0, opacity: 1, duration: MOTION.dur.navPulse, ease: MOTION.ease.settle }, 0.12)
    if (badge instanceof HTMLElement) {
      tl.to(
        badge,
        {
          boxShadow: "0 0 0 rgba(74, 158, 255, 0)",
          scale: 1,
          duration: 0.42,
          ease: "sine.inOut",
        },
        0.16
      )
    }
    tl.to(btnPrev, { scale: 0.94, duration: 0.1, ease: "power2.in", yoyo: true, repeat: 1 }, 0.06)
    postToNavDockEarth("rewind")
  }

  function playHomeNavAnimation(onComplete) {
    if (!(btnHome instanceof HTMLButtonElement) || motionRef.reduced) {
      onComplete()
      return
    }

    const glyph = btnHome.querySelector(".nav-dock__glyph")
    btnHome.classList.add("is-animating")
    gsap.killTweensOf([btnHome, glyph].filter(Boolean))

    const tl = gsap.timeline({
      onComplete: () => {
        btnHome.classList.remove("is-animating")
        if (glyph) gsap.set(glyph, { clearProps: "transform,opacity" })
        onComplete()
      },
    })

    tl.to(glyph, { scale: 1.14, rotate: 18, duration: 0.14, ease: "power2.out" }, 0)
    tl.to(glyph, { scale: 1, rotate: 0, duration: 0.38, ease: "power2.out" }, 0.12)
    tl.to(btnHome, { scale: 0.96, duration: 0.08, ease: "power2.in", yoyo: true, repeat: 1 }, 0)
  }

  return { updateNavDock, playBackNavAnimation, playHomeNavAnimation, postToNavDockEarth }
}
