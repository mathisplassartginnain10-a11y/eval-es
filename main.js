import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { createSlideStage } from "./src/slideStage.js"
import {
  bindScrollTriggerResizeRefresh,
  configureGsapPerformance,
  detectIpadLike,
  initLayoutEntranceAnimations,
  setupDotsScrollFeedback,
  setupFinePointerHoverNudges,
} from "./src/textAnimations.js"
import { initScroll, scrollToSection, SECTION_COUNT, killPuitsScrollTrigger, setupPuitsScrollTrigger, setIntroStarsInteractionGuards } from "./src/scroll.js"
import { KEYFRAMES, keyframeToSlideMedia, mediaSpecToSlideMedia } from "./src/sections.js"
import { createSphereAnim } from "./src/sphereAnim.js"
import { CONTENT, SECTION_LABELS } from "./src/content.js"

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
}

const isIpadLike = detectIpadLike()
configureGsapPerformance({ reducedMotion: motionRef.reduced, isIpad: isIpadLike })
if (isIpadLike && !motionRef.reduced) {
  gsap.globalTimeline.timeScale(1.28)
}

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  motionRef.reduced = e.matches
})

const appRoot = document.getElementById("app")
const progressBar = document.getElementById("progress-bar")
const progressTrack = document.querySelector(".progress-track")
const textOverlay = document.getElementById("text-overlay")
const textKicker = document.getElementById("text-kicker")
const textTitle = document.getElementById("text-title")
const textSubtitle = document.getElementById("text-subtitle")
const textBody = document.getElementById("text-body")
const textCredit = document.getElementById("text-credit")
const sectionLabelEl = document.getElementById("section-label")
const stepIndicatorEl = document.getElementById("step-indicator")
const dotsNav = document.getElementById("section-dots")
const stageSingle = document.getElementById("stage-single")
const stageSphereHost = document.getElementById("stage-sphere-host")
const stageTilesRoot = document.getElementById("stage-tiles")
const eratoPromptWrap = document.getElementById("erato-prompt-wrap")
const puitsStageWrap = document.getElementById("puits-stage-wrap")
const introClipsWrap = document.getElementById("intro-clips-wrap")
const stageMediaWrap = document.getElementById("stage-media-wrap")
const scrollRoot = document.getElementById("scroll-root")
const stageVideo = document.querySelector("#stage-video")
const stageImage = document.querySelector("#stage-image")

if (!stageVideo || !stageImage) {
  throw new Error("Éléments #stage-video et #stage-image requis (index.html).")
}

if (!stageSingle || !stageTilesRoot) {
  throw new Error("Conteneurs #stage-single et #stage-tiles requis (index.html).")
}

if (!stageSphereHost) {
  throw new Error("Conteneur #stage-sphere-host requis (index.html).")
}

if (!eratoPromptWrap) {
  throw new Error("Conteneur #erato-prompt-wrap requis (index.html).")
}

if (!puitsStageWrap) {
  throw new Error("Conteneur #puits-stage-wrap requis (index.html).")
}

if (!introClipsWrap) {
  throw new Error("Conteneur #intro-clips-wrap requis (index.html).")
}

if (!stageMediaWrap) {
  throw new Error("Conteneur #stage-media-wrap requis (index.html).")
}

/** @type {ReturnType<createSphereAnim> | null} */
let sphereAnimApi = null

function ensureSphereAnim() {
  if (!sphereAnimApi) {
    sphereAnimApi = createSphereAnim(stageSphereHost, { embed: true })
  }
  return sphereAnimApi
}

const tileHosts = [...stageTilesRoot.querySelectorAll(".stage-tile")]
const tileStages = tileHosts.map((host, idx) => {
  const v = host.querySelector(".stage-tile-video")
  const img = host.querySelector(".stage-tile-image")
  if (!(v instanceof HTMLVideoElement) || !(img instanceof HTMLImageElement)) {
    throw new Error(`Tuile média invalide à l’index ${idx} (vidéo + image attendues).`)
  }
  return createSlideStage(v, img, { reducedMotion: motionRef.reduced })
})

const slideStage = createSlideStage(stageVideo, stageImage, { reducedMotion: motionRef.reduced })

function buildScrollShell() {
  dotsNav.replaceChildren()
  scrollRoot.replaceChildren()

  for (let i = 0; i < SECTION_COUNT; i++) {
    const label = SECTION_LABELS[i] ?? `Étape ${i + 1}`

    const dot = document.createElement("button")
    dot.type = "button"
    dot.className = "section-dot" + (i === 0 ? " is-active" : "")
    dot.dataset.section = String(i)
    dot.title = label
    dot.setAttribute("aria-label", label)
    if (i === 0) dot.setAttribute("aria-current", "true")
    dotsNav.appendChild(dot)

    const panel = document.createElement("section")
    panel.className = "scroll-panel"
    panel.dataset.index = String(i)
    panel.setAttribute("aria-label", label)
    scrollRoot.appendChild(panel)
  }
}

buildScrollShell()
const dots = [...document.querySelectorAll(".section-dot")]

bindScrollTriggerResizeRefresh()
initLayoutEntranceAnimations({ reducedMotion: motionRef.reduced })
if (!motionRef.reduced) {
  setupDotsScrollFeedback(scrollRoot, dots)
}
setupFinePointerHoverNudges()

let lastTextKey = null
/** @type {ReturnType<initScroll> | null} */
let scrollApi = null

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function fillTextContent(key) {
  const block = CONTENT[key]
  if (!block) return

  const rub = typeof block.rubrique === "string" ? block.rubrique.trim() : ""
  textKicker.textContent = rub
  textKicker.hidden = !rub

  const titreLines = String(block.titre ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let titreHtml
  if (block.introPoster && titreLines.length) {
    titreHtml = titreLines
      .map((line) => {
        const words = line.split(/\s+/).filter(Boolean)
        return words
          .map(
            (w) =>
              `<span class="title-word"><span class="title-word__inner">${escapeHtml(w)}</span></span>`
          )
          .join(" ")
      })
      .join("<br />")
  } else {
    titreHtml = titreLines.map((line) => escapeHtml(line)).join("<br />")
  }

  textTitle.classList.toggle("partie-title", !!block.partTitle)
  textTitle.innerHTML = `<span class="text-overlay__title-inner">${titreHtml}</span>`
  textOverlay.classList.toggle("text-overlay--stacked-title", titreLines.length > 1)
  textOverlay.classList.toggle("text-overlay--title-rule", !!block.titleUnderline)
  textOverlay.classList.toggle("text-overlay--intro-poster", !!block.introPoster)

  const st = typeof block.sousTitre === "string" ? block.sousTitre.trim() : ""
  textSubtitle.textContent = st
  textSubtitle.hidden = !st

  textBody.innerHTML = block.paragraphes
    .map((p) => `<p class="text-overlay__p" data-anim="fade-up">${escapeHtml(p)}</p>`)
    .join("")

  if (block.credit) {
    textCredit.textContent = block.credit
    textCredit.hidden = false
  } else {
    textCredit.textContent = ""
    textCredit.hidden = true
  }
}

const introPageMeta = document.querySelector(".intro-page-meta")

/** @type {gsap.core.Timeline | null} */
let pageEnterTimeline = null

function killPageEnterTimeline() {
  if (pageEnterTimeline) {
    pageEnterTimeline.kill()
    pageEnterTimeline = null
  }
}

/** Remet opacité / transform après tween interrompu (swipe rapide). */
function snapPageEnterLayerComplete() {
  if (!(stageMediaWrap instanceof HTMLElement)) return
  gsap.killTweensOf(stageMediaWrap)
  gsap.set(stageMediaWrap, { autoAlpha: 1, clearProps: "opacity,visibility,transform" })

  const textEls = collectTextOverlayTweenTargets()
  if (textEls.length) gsap.killTweensOf(textEls)
  if (textOverlay && !textOverlay.hidden) {
    if (textEls.length) gsap.set(textEls, { autoAlpha: 1, clearProps: "opacity,visibility,transform" })
    textOverlay.classList.add("is-visible")
  } else {
    if (textEls.length) gsap.set(textEls, { clearProps: "opacity,visibility,transform" })
  }

  if (introPageMeta instanceof HTMLElement) {
    gsap.killTweensOf(introPageMeta)
    gsap.set(introPageMeta, { clearProps: "opacity,visibility,transform" })
  }
}

/** Éléments texte pour kill / snap (inclut les paragraphes du corps). */
function collectTextOverlayTweenTargets() {
  if (!textOverlay || textOverlay.hidden) return []
  const parts = [textKicker, textTitle, textSubtitle, textBody, textCredit].filter(
    (el) => el instanceof HTMLElement && !el.hidden
  )
  const ps =
    textBody instanceof HTMLElement && !textBody.hidden
      ? [...textBody.querySelectorAll("p")]
      : []
  return [...parts, ...ps]
}

/** Cibles pour la timeline d’entrée (paragraphes séparés pour le stagger). */
function collectTextEnterTimelineTargets() {
  if (!textOverlay || textOverlay.hidden) return []
  const parts = [textKicker, textTitle, textSubtitle, textCredit].filter(
    (el) => el instanceof HTMLElement && !el.hidden
  )
  const ps =
    textBody instanceof HTMLElement && !textBody.hidden
      ? [...textBody.querySelectorAll("p")]
      : []
  return [...parts, ...ps]
}

/**
 * Avant la frame d’entrée : colonne média + texte en état « caché » pour éviter
 * un flash d’opacité 1 puis tween (les transitions CSS seules restaient souvent invisibles).
 */
function primePageEnterHidden(sectionIndex) {
  if (motionRef.reduced || !(stageMediaWrap instanceof HTMLElement)) return

  killPageEnterTimeline()
  snapPageEnterLayerComplete()

  const textTargets = collectTextEnterTimelineTargets()
  const killList = [stageMediaWrap, ...textTargets]
  if (introPageMeta instanceof HTMLElement) killList.push(introPageMeta)
  gsap.killTweensOf(killList)

  if (textOverlay && !textOverlay.hidden) textOverlay.classList.remove("is-visible")
  stageMediaWrap.classList.remove("stage-media-wrap--enter")
  if (introPageMeta instanceof HTMLElement) {
    introPageMeta.classList.remove("intro-page-meta--enter")
    if (sectionIndex !== 0) {
      gsap.set(introPageMeta, { clearProps: "opacity,visibility,transform" })
    }
  }

  gsap.set(stageMediaWrap, { autoAlpha: 0, y: 24, force3D: true })

  const isIntroPoster = textOverlay?.classList.contains("text-overlay--intro-poster")
  const isPartTitle = textTitle instanceof HTMLElement && textTitle.classList.contains("partie-title")
  const primeText =
    sectionIndex === 0 && isIntroPoster
      ? textTargets.filter((el) => el !== textTitle)
      : isPartTitle && !(sectionIndex === 0 && isIntroPoster)
        ? textTargets.filter((el) => el !== textTitle)
        : textTargets
  if (primeText.length) gsap.set(primeText, { autoAlpha: 0, y: 24, force3D: true })
  if (sectionIndex === 0 && isIntroPoster && textTitle instanceof HTMLElement) {
    const inners = textTitle.querySelectorAll(".title-word__inner")
    if (inners.length) {
      gsap.set(inners, { yPercent: 118, autoAlpha: 0, force3D: true })
      gsap.set(textTitle, { autoAlpha: 1, y: 0, clearProps: "transform" })
    }
  } else if (isPartTitle && textTitle instanceof HTMLElement) {
    gsap.set(textTitle, { x: -48, autoAlpha: 0, force3D: true })
  }
  if (sectionIndex === 0 && introPageMeta instanceof HTMLElement) {
    gsap.set(introPageMeta, { autoAlpha: 0, y: 24 })
  }
}

function triggerPageEnterEffects(sectionIndex) {
  if (!(stageMediaWrap instanceof HTMLElement)) return

  if (motionRef.reduced) {
    killPageEnterTimeline()
    snapPageEnterLayerComplete()
    return
  }

  const textTargetsAll = collectTextEnterTimelineTargets()
  const isIntroPoster = textOverlay?.classList.contains("text-overlay--intro-poster")
  const isPartTitle = textTitle instanceof HTMLElement && textTitle.classList.contains("partie-title")

  let textForStagger = textTargetsAll
  if (sectionIndex === 0 && isIntroPoster) {
    textForStagger = textTargetsAll.filter((el) => el !== textTitle)
  } else if (isPartTitle && !isIntroPoster) {
    textForStagger = textTargetsAll.filter((el) => el !== textTitle)
  }

  const introTargets = sectionIndex === 0 && introPageMeta instanceof HTMLElement ? [introPageMeta] : []

  const ease = "power2.out"
  const dur = isIpadLike ? 0.72 : 0.88
  const stagger = isIpadLike ? 0.045 : 0.08

  pageEnterTimeline = gsap.timeline({
    onComplete: () => {
      pageEnterTimeline = null
      gsap.set(stageMediaWrap, { clearProps: "opacity,visibility,transform" })
      const clearEls = collectTextOverlayTweenTargets()
      if (clearEls.length) gsap.set(clearEls, { clearProps: "opacity,visibility,transform" })
      const innersDone = textTitle?.querySelectorAll?.(".title-word__inner") ?? []
      if (innersDone.length) gsap.set(innersDone, { clearProps: "opacity,visibility,transform" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
      if (introTargets.length) gsap.set(introTargets, { clearProps: "opacity,visibility,transform" })
    },
  })

  pageEnterTimeline.fromTo(
    stageMediaWrap,
    { autoAlpha: 0, y: 24, force3D: true },
    { autoAlpha: 1, y: 0, duration: dur, ease },
    0
  )
  if (textForStagger.length) {
    pageEnterTimeline.fromTo(
      textForStagger,
      { autoAlpha: 0, y: 24, force3D: true },
      { autoAlpha: 1, y: 0, duration: dur, ease, stagger },
      0.08
    )
  }
  if (sectionIndex === 0 && isIntroPoster && textTitle) {
    const inners = textTitle.querySelectorAll(".title-word__inner")
    if (inners.length) {
      const wDur = isIpadLike ? 0.58 : 0.92
      const wSt = isIpadLike ? 0.04 : 0.085
      pageEnterTimeline.fromTo(
        inners,
        { yPercent: 118, autoAlpha: 0, force3D: true },
        { yPercent: 0, autoAlpha: 1, duration: wDur, stagger: wSt, ease: "expo.out" },
        0.18
      )
    }
  }
  if (isPartTitle && !isIntroPoster && textTitle instanceof HTMLElement) {
    pageEnterTimeline.fromTo(
      textTitle,
      { x: -44, autoAlpha: 0, force3D: true },
      { x: 0, autoAlpha: 1, duration: isIpadLike ? 0.62 : 0.82, ease: "power3.out" },
      0.1
    )
  }
  if (introTargets.length) {
    pageEnterTimeline.fromTo(introTargets, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: dur, ease }, 0.05)
  }
}

function applyTextIfChanged(textKey) {
  if (textKey === lastTextKey) return
  lastTextKey = textKey
  fillTextContent(textKey)
}

/** Rafraîchit le texte même si la clé est identique (ex. retour sur une étape), pour les flags `hidden` / le DOM. */
function applyTextForSection(textKey) {
  lastTextKey = null
  applyTextIfChanged(textKey)
}

function applySlideForIndex(index, meta = {}) {
  const kf = KEYFRAMES[index]
  if (!kf?.puitsScrollSection) {
    killPuitsScrollTrigger()
    puitsStageWrap.hidden = true
    puitsStageWrap.setAttribute("aria-hidden", "true")
  }

  const sphereSub = meta.sphereSubStep

  if (index === 0) {
    introClipsWrap.hidden = false
    introClipsWrap.setAttribute("aria-hidden", "false")
    stageMediaWrap.setAttribute("aria-hidden", "false")
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    sphereAnimApi?.reset()
    stageSphereHost.hidden = true
    stageSphereHost.setAttribute("aria-hidden", "true")
    return
  }

  introClipsWrap.hidden = true
  introClipsWrap.setAttribute("aria-hidden", "true")

  if (kf.puitsScrollSection) {
    stageTilesRoot.hidden = true
    sphereAnimApi?.reset()
    stageSphereHost.hidden = true
    stageSphereHost.setAttribute("aria-hidden", "true")
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageSingle.hidden = true
    slideStage.clear()
    puitsStageWrap.hidden = false
    puitsStageWrap.setAttribute("aria-hidden", "false")
    const puitsScroller = document.getElementById("puits-scroll-scroller")
    if (puitsScroller instanceof HTMLElement) puitsScroller.scrollTop = 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setupPuitsScrollTrigger()
      })
    })
    return
  }

  if (kf.eratoTwoStep) {
    const showIframe = sphereSub === 1
    stageTilesRoot.hidden = true
    sphereAnimApi?.reset()
    stageSphereHost.hidden = true
    stageSphereHost.setAttribute("aria-hidden", "true")
    if (!showIframe) {
      eratoPromptWrap.hidden = true
      eratoPromptWrap.setAttribute("aria-hidden", "true")
      stageSingle.hidden = false
      slideStage.apply(keyframeToSlideMedia(kf))
    } else {
      slideStage.clear()
      stageSingle.hidden = true
      eratoPromptWrap.hidden = false
      eratoPromptWrap.setAttribute("aria-hidden", "false")
    }
    return
  }

  eratoPromptWrap.hidden = true
  eratoPromptWrap.setAttribute("aria-hidden", "true")

  if (kf.sphereTwoStep) {
    const play = sphereSub === 1
    stageTilesRoot.hidden = true
    stageSingle.hidden = false
    slideStage.clear()
    stageSphereHost.hidden = false
    stageSphereHost.setAttribute("aria-hidden", "false")
    const api = ensureSphereAnim()
    if (!play) {
      api.reset()
    } else {
      api.reset()
      if (motionRef.reduced) {
        api.seek(1)
      } else {
        void api.play()
      }
    }
    return
  }

  sphereAnimApi?.reset()
  stageSphereHost.hidden = true
  stageSphereHost.setAttribute("aria-hidden", "true")

  const tiles = kf.tiles

  if (Array.isArray(tiles) && tiles.length > 0) {
    stageSingle.hidden = true
    stageTilesRoot.hidden = false
    slideStage.clear()
    tiles.forEach((spec, i) => {
      const st = tileStages[i]
      if (st) st.apply(mediaSpecToSlideMedia(spec))
    })
    for (let j = tiles.length; j < tileStages.length; j++) {
      tileStages[j]?.clear()
    }
    return
  }

  stageSingle.hidden = false
  stageTilesRoot.hidden = true
  tileStages.forEach((s) => s.clear())
  slideStage.apply(keyframeToSlideMedia(kf))
}

function updateUi(sectionIndex) {
  const kf = KEYFRAMES[sectionIndex]
  let layout = "split"
  if (sectionIndex === 0) layout = "intro"
  else if (kf?.sphereTwoStep || kf?.eratoTwoStep) layout = "sphere"
  if (appRoot) {
    appRoot.dataset.layout = layout
  }

  const spherePage = !!kf?.sphereTwoStep
  if (progressTrack instanceof HTMLElement) {
    progressTrack.hidden = spherePage
  }
  if (textOverlay) {
    textOverlay.hidden = spherePage
    textOverlay.setAttribute("aria-hidden", spherePage ? "true" : "false")
  }

  const pct = ((sectionIndex + 1) / SECTION_COUNT) * 100
  if (progressBar instanceof HTMLElement) {
    if (motionRef.reduced) {
      gsap.killTweensOf(progressBar)
      progressBar.style.width = `${pct}%`
    } else {
      gsap.to(progressBar, {
        width: `${pct}%`,
        duration: isIpadLike ? 0.34 : 0.48,
        ease: "power2.out",
        overwrite: "auto",
      })
    }
  }

  dots.forEach((d, i) => {
    d.classList.toggle("is-active", i === sectionIndex)
    d.setAttribute("aria-current", i === sectionIndex ? "true" : "false")
  })

  sectionLabelEl.textContent = SECTION_LABELS[sectionIndex] ?? ""
  if (stepIndicatorEl) {
    stepIndicatorEl.textContent = `Étape ${sectionIndex + 1} / ${SECTION_COUNT}`
  }
}

const k0 = KEYFRAMES[0]
updateUi(0)
applySlideForIndex(0, {})
applyTextIfChanged(k0.textSection)
if (!motionRef.reduced) primePageEnterHidden(0)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    triggerPageEnterEffects(0)
  })
})

scrollApi = initScroll({
  reducedMotion: motionRef.reduced,
  onTransitionStart: (idx, kf, meta = {}) => {
    applySlideForIndex(idx, meta)
    if (meta.subStepOnly) applyTextIfChanged(kf.textSection)
    else applyTextForSection(kf.textSection)
    updateUi(idx)
    if (meta.subStepOnly) return
    if (!motionRef.reduced) primePageEnterHidden(idx)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        triggerPageEnterEffects(idx)
      })
    })
  },
  onTransitionComplete: () => {},
  /** `updateUi` est déjà appelé dans `onTransitionStart` — évite double recalcul layout / dots. */
  onProgressUi: () => {}
})

/** @type {null | (() => void)} */
let introStarsExitIntro = null

function initIntroStarsOverlay() {
  const frame = document.getElementById("intro-stars-frame")
  if (!(frame instanceof HTMLIFrameElement)) return

  document.body.classList.add("intro-stars-phase")
  document.body.style.overflow = "hidden"

  const clipFrames = () =>
    [...document.querySelectorAll("#intro-clips-wrap iframe.intro-clip-frame")]

  for (const el of clipFrames()) {
    el.style.transformOrigin = "center center"
    el.style.transform = "scale(0.05)"
  }

  let exited = false
  let safetyUnlockTimer = 0

  function exitIntro() {
    if (exited) return
    exited = true
    introStarsExitIntro = null
    if (safetyUnlockTimer) window.clearTimeout(safetyUnlockTimer)
    setIntroStarsInteractionGuards(null)

    frame.contentWindow?.IntroStars?.exit?.()

    snapPageEnterLayerComplete()

    for (const f of clipFrames()) {
      f.style.transform = "scale(0.05)"
      f.style.transition = "none"
      f.style.transformOrigin = "center center"
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const f of clipFrames()) {
          f.style.transition = "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
          f.style.transform = "scale(1)"
        }
      })
    })

    setTimeout(() => {
      frame.style.transition = "opacity 0.8s ease"
      frame.style.opacity = "0"
      setTimeout(() => {
        frame.remove()
        document.body.classList.remove("intro-stars-phase")
        document.body.style.overflow = ""
      }, 800)
    }, 100)

    const names = document.getElementById("persistent-names")
    if (names instanceof HTMLElement) names.style.opacity = "1"

    const hint = document.getElementById("scroll-hint")
    if (hint instanceof HTMLElement) hint.style.opacity = "0"
  }

  introStarsExitIntro = exitIntro

  setIntroStarsInteractionGuards({
    wheel: () => {
      if (exited) return false
      exitIntro()
      return true
    },
  })

  safetyUnlockTimer = window.setTimeout(() => {
    if (!exited) {
      document.body.style.overflow = ""
      document.body.classList.remove("intro-stars-phase")
    }
  }, 4000)

  function wireIntroReady() {
    const api = frame.contentWindow?.IntroStars
    if (api && typeof api.onComplete === "function") {
      let done = false
      api.onComplete(() => {
        if (done) return
        done = true
        if (safetyUnlockTimer) window.clearTimeout(safetyUnlockTimer)
        document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
          if (!(el instanceof HTMLIFrameElement)) return
          const ds = el.dataset.src
          if (ds && (!el.src || el.src === "about:blank")) el.src = ds
        })
        document.body.style.overflow = ""
        document.body.classList.remove("intro-stars-phase")
        const hint = document.getElementById("scroll-hint")
        if (hint instanceof HTMLElement) hint.style.opacity = "1"
      })
    } else {
      if (safetyUnlockTimer) window.clearTimeout(safetyUnlockTimer)
      document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
        if (!(el instanceof HTMLIFrameElement)) return
        const ds = el.dataset.src
        if (ds && (!el.src || el.src === "about:blank")) el.src = ds
      })
      document.body.style.overflow = ""
      document.body.classList.remove("intro-stars-phase")
      const hint = document.getElementById("scroll-hint")
      if (hint instanceof HTMLElement) hint.style.opacity = "1"
    }
  }

  if (frame.contentDocument?.readyState === "complete") queueMicrotask(wireIntroReady)
  else frame.addEventListener("load", () => queueMicrotask(wireIntroReady), { once: true })

  const onFirstScrollLike = () => {
    introStarsExitIntro?.()
  }
  window.addEventListener("scroll", onFirstScrollLike, { passive: true, once: true })
  window.addEventListener("touchmove", onFirstScrollLike, { passive: true, once: true })
}

initIntroStarsOverlay()

dots.forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number.parseInt(btn.dataset.section, 10)
    scrollToSection(idx, motionRef.reduced, scrollApi)
  })
})

window.addEventListener("load", () => {
  scrollApi?.refresh()
  ScrollTrigger.refresh()
})

window.addEventListener("keydown", (e) => {
  if (e.defaultPrevented) return
  const t = e.target
  if (t && (t.isContentEditable || (t.closest && t.closest("input, textarea, select")))) return

  if (document.getElementById("intro-stars-frame") && introStarsExitIntro) {
    if (e.key === " " || e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault()
      introStarsExitIntro()
      return
    }
  }

  if (scrollApi?.isLocked?.()) return

  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault()
    scrollApi?.stepBy(1)
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault()
    scrollApi?.stepBy(-1)
  } else if (e.key === "Home") {
    e.preventDefault()
    scrollToSection(0, motionRef.reduced, scrollApi)
  } else if (e.key === "End") {
    e.preventDefault()
    scrollToSection(SECTION_COUNT - 1, motionRef.reduced, scrollApi)
  }
})
