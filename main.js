import gsap from "gsap"
import { createSlideStage } from "./src/slideStage.js"
import {
  bindViewportResizeDebounced,
  configureGsapPerformance,
  detectIpadLike,
  initLayoutEntranceAnimations,
  updateDotsVisualState,
  setupFinePointerHoverNudges,
} from "./src/textAnimations.js"
import { initScroll, scrollToSection, SECTION_COUNT } from "./src/scroll.js"
import { runPageTransition } from "./src/pageTransition.js"
import { MOTION } from "./src/motionDesign.js"
import {
  KEYFRAMES,
  keyframeToSlideMedia,
  mediaSpecToSlideMedia,
  isEpilogueKeyframe,
  keyframeToNavIndex,
  NAV_SECTION_COUNT,
} from "./src/sections.js"
import { CONTENT, SECTION_LABELS } from "./src/content.js"
import {
  initStarsBackground,
  restartStarsAfterFinale,
  runPresentationFinale,
  setStarsBackgroundActive,
  setStarsBackgroundReducedMotion,
} from "./src/starsBg.js"

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
}

const isIpadLike = detectIpadLike()
configureGsapPerformance({ reducedMotion: motionRef.reduced, isIpad: isIpadLike })
if (isIpadLike && !motionRef.reduced) {
  gsap.globalTimeline.timeScale(1.06)
}

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  motionRef.reduced = e.matches
  setStarsBackgroundReducedMotion(e.matches)
})

const appRoot = document.getElementById("app")

initStarsBackground({ reducedMotion: motionRef.reduced })
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
const puitsPromptWrap = document.getElementById("puits-prompt-wrap")
const topoPromptWrap = document.getElementById("topo-prompt-wrap")
const conclusionPromptWrap = document.getElementById("conclusion-prompt-wrap")
const epilogueActions = document.getElementById("epilogue-actions")
const btnEndPresentation = document.getElementById("btn-end-presentation")
const presentationBlackout = document.getElementById("presentation-blackout")
const scrollHintEl = document.getElementById("scroll-hint")

let presentationEnded = false
let presentationEnding = false
const page4AnimWrap = document.getElementById("page4-anim-wrap")
const sphereAplatieWrap = document.getElementById("sphere-aplatie-wrap")
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

if (!puitsPromptWrap) {
  throw new Error("Conteneur #puits-prompt-wrap requis (index.html).")
}

if (!topoPromptWrap) {
  throw new Error("Conteneur #topo-prompt-wrap requis (index.html).")
}

if (!conclusionPromptWrap) {
  throw new Error("Conteneur #conclusion-prompt-wrap requis (index.html).")
}

if (!page4AnimWrap) {
  throw new Error("Conteneur #page4-anim-wrap requis (index.html).")
}

if (!sphereAplatieWrap) {
  throw new Error("Conteneur #sphere-aplatie-wrap requis (index.html).")
}

if (!introClipsWrap) {
  throw new Error("Conteneur #intro-clips-wrap requis (index.html).")
}

if (!stageMediaWrap) {
  throw new Error("Conteneur #stage-media-wrap requis (index.html).")
}

function postToSphereAplatieFrame(msg) {
  const fr = document.getElementById("sphere-aplatie-frame")
  try {
    fr?.contentWindow?.postMessage(msg, "*")
  } catch (_) {
    /* iframe absente ou cross-origin */
  }
}

function hideSphereAplatieMedia() {
  sphereAplatieWrap.hidden = true
  sphereAplatieWrap.setAttribute("aria-hidden", "true")
  if (stageSphereHost) {
    stageSphereHost.hidden = true
    stageSphereHost.setAttribute("aria-hidden", "true")
  }
}

function applySphereAplatieStep(sphereSub) {
  const play = sphereSub === 1
  stageTilesRoot.hidden = true
  stageSingle.hidden = true
  slideStage.clear()
  eratoPromptWrap.hidden = true
  eratoPromptWrap.setAttribute("aria-hidden", "true")
  sphereAplatieWrap.hidden = false
  sphereAplatieWrap.setAttribute("aria-hidden", "false")
  queueMicrotask(() => {
    if (!play) {
      postToSphereAplatieFrame("reset")
      return
    }
    if (motionRef.reduced) {
      postToSphereAplatieFrame("reset")
      try {
        document.getElementById("sphere-aplatie-frame")?.contentWindow?.SphereAplatieAnim?.seek(1)
      } catch (_) {
        /* iframe pas prête */
      }
      return
    }
    postToSphereAplatieFrame("play")
  })
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
    const kf = KEYFRAMES[i]
    const label = SECTION_LABELS[i] ?? `Étape ${i + 1}`

    if (!isEpilogueKeyframe(kf)) {
      const dot = document.createElement("button")
      dot.type = "button"
      dot.className = "section-dot" + (i === 0 ? " is-active" : "")
      dot.dataset.section = String(i)
      dot.title = label
      dot.setAttribute("aria-label", label)
      if (i === 0) dot.setAttribute("aria-current", "true")
      dotsNav.appendChild(dot)
    }

    const panel = document.createElement("section")
    panel.className = "scroll-panel"
    panel.dataset.index = String(i)
    panel.setAttribute("aria-label", label)
    scrollRoot.appendChild(panel)
  }
}

buildScrollShell()
const dots = [...document.querySelectorAll(".section-dot")]
const pageTransitionRoot = document.getElementById("page-transition")
const navDock = document.getElementById("nav-dock")
const navDockSep = navDock?.querySelector(".nav-dock__sep") ?? null
const btnHome = document.getElementById("btn-home")
const btnPrev = document.getElementById("btn-prev")
function postToNavDockEarth(msg) {
  const fr = document.getElementById("nav-dock-earth-frame")
  try {
    fr?.contentWindow?.postMessage(msg, "*")
  } catch (_) {
    /* iframe absente */
  }
}

function updateScrollHint(sectionIndex) {
  if (!(scrollHintEl instanceof HTMLElement)) return
  if (document.body.classList.contains("intro-stars-phase") || presentationEnded || presentationEnding) {
    scrollHintEl.hidden = true
    scrollHintEl.style.opacity = "0"
    scrollHintEl.setAttribute("aria-hidden", "true")
    return
  }
  const isEpilogue = isEpilogueKeyframe(KEYFRAMES[sectionIndex])
  const show = !isEpilogue
  scrollHintEl.hidden = !show
  scrollHintEl.style.opacity = show ? "1" : "0"
  scrollHintEl.setAttribute("aria-hidden", show ? "false" : "true")
}

function updateNavDock(sectionIndex) {
  const show =
    sectionIndex > 0 &&
    !isEpilogueKeyframe(KEYFRAMES[sectionIndex]) &&
    !introActive &&
    !document.body.classList.contains("intro-stars-phase")
  if (navDock instanceof HTMLElement) {
    navDock.classList.toggle("is-visible", show)
    navDock.hidden = !show
  }
  postToNavDockEarth(show ? "resume" : "pause")
}

/** Animation du bouton Retour — synchronisée avec le warp arrière. */
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

/** Animation légère vers le sommaire (globe). */
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

bindViewportResizeDebounced(() => {
  scrollApi?.refresh()
})
initLayoutEntranceAnimations({ reducedMotion: motionRef.reduced })
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

  const isEpilogue = !!block.epilogue
  textOverlay.classList.toggle("text-overlay--epilogue", isEpilogue)

  if (isEpilogue) {
    textOverlay.classList.remove("text-overlay--sommaire")
    textKicker.textContent = ""
    textKicker.hidden = true
    textSubtitle.textContent = ""
    textSubtitle.hidden = true
    textBody.innerHTML = ""
    textCredit.textContent = ""
    textCredit.hidden = true
    textTitle.hidden = false
    textTitle.classList.remove("partie-title")
    textTitle.innerHTML = `<span class="text-overlay__title-inner epilogue-title">${escapeHtml(
      String(block.titre ?? "Merci de votre écoute").trim()
    )}</span>`
    textOverlay.classList.remove(
      "text-overlay--stacked-title",
      "text-overlay--title-rule",
      "text-overlay--intro-poster"
    )
    return
  }

  textOverlay.classList.remove("text-overlay--epilogue")

  const sommaireItems = block.sommaire && Array.isArray(block.sommaireItems) ? block.sommaireItems : null
  textOverlay.classList.toggle("text-overlay--sommaire", !!sommaireItems)

  if (sommaireItems) {
    textKicker.textContent = ""
    textKicker.hidden = true

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

    textTitle.hidden = false
    textTitle.classList.toggle("partie-title", !!block.partTitle)
    textTitle.innerHTML = titreLines.length
      ? `<span class="text-overlay__title-inner">${titreHtml}</span>`
      : ""

    textOverlay.classList.toggle("text-overlay--stacked-title", titreLines.length > 1)
    textOverlay.classList.toggle("text-overlay--title-rule", !!block.titleUnderline)
    textOverlay.classList.toggle("text-overlay--intro-poster", !!block.introPoster)

    const sommaireLabel =
      typeof block.sommaireLabel === "string" && block.sommaireLabel.trim()
        ? block.sommaireLabel.trim()
        : "Sommaire"
    textSubtitle.textContent = sommaireLabel
    textSubtitle.hidden = false

    const itemsHtml = sommaireItems
      .map((item) => {
        const partRaw = String(item?.part ?? "").trim()
        const titreRaw = String(item?.titre ?? "").trim()
        const part = escapeHtml(partRaw)
        const titre = escapeHtml(titreRaw)
        const scrollIndex = Number(item?.scrollIndex)
        const partHtml = part ? `<span class="text-overlay__sommaire-part">${part}</span>` : ""
        const titreHtml = titre ? `<span class="text-overlay__sommaire-titre">${titre}</span>` : ""
        const label = [partRaw, titreRaw].filter(Boolean).join(" — ")
        const idxAttr = Number.isFinite(scrollIndex) ? ` data-section-index="${scrollIndex}"` : ""
        const aria = label ? ` aria-label="${escapeHtml(label)}"` : ""
        return `<li class="text-overlay__sommaire-item"><button type="button" class="text-overlay__sommaire-btn"${idxAttr}${aria}>${partHtml}${titreHtml}</button></li>`
      })
      .join("")
    textBody.innerHTML = `<ul class="text-overlay__sommaire-list" role="list">${itemsHtml}</ul>`

    if (block.credit) {
      textCredit.textContent = block.credit
      textCredit.hidden = false
    } else {
      textCredit.textContent = ""
      textCredit.hidden = true
    }
    return
  }

  textTitle.hidden = false

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
  textTitle.innerHTML = titreLines.length
    ? `<span class="text-overlay__title-inner">${titreHtml}</span>`
    : ""

  textOverlay.classList.toggle("text-overlay--stacked-title", titreLines.length > 1)
  textOverlay.classList.toggle("text-overlay--title-rule", !!block.titleUnderline)
  textOverlay.classList.toggle("text-overlay--intro-poster", !!block.introPoster)

  const st = typeof block.sousTitre === "string" ? block.sousTitre.trim() : ""
  textSubtitle.textContent = st
  textSubtitle.hidden = !st

  const bodyHtml = typeof block.bodyHtml === "string" ? block.bodyHtml.trim() : ""
  if (bodyHtml) {
    textBody.innerHTML = bodyHtml
  } else {
    textBody.innerHTML = block.paragraphes
      .map((p) => `<p class="text-overlay__p">${escapeHtml(p)}</p>`)
      .join("")
  }

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
  const sommaireItems =
    textBody instanceof HTMLElement && !textBody.hidden
      ? [...textBody.querySelectorAll(".text-overlay__sommaire-item")]
      : []
  return [...parts, ...ps, ...sommaireItems]
}

/**
 * Avant la frame d’entrée : colonne média en état « caché » (le texte reste visible, sans tween).
 */
function primePageEnterHidden(sectionIndex) {
  if (motionRef.reduced || !(stageMediaWrap instanceof HTMLElement)) return

  killPageEnterTimeline()
  snapPageEnterLayerComplete()

  const textTargets = collectTextOverlayTweenTargets()
  const killList = [stageMediaWrap, ...textTargets]
  if (introPageMeta instanceof HTMLElement) killList.push(introPageMeta)
  gsap.killTweensOf(killList)

  stageMediaWrap.classList.remove("stage-media-wrap--enter")
  if (introPageMeta instanceof HTMLElement) {
    introPageMeta.classList.remove("intro-page-meta--enter")
    if (sectionIndex !== 0) {
      gsap.set(introPageMeta, { clearProps: "opacity,visibility,transform" })
    }
  }

  gsap.set(stageMediaWrap, { autoAlpha: 0, y: 24, force3D: true })
}

function triggerPageEnterEffects() {
  if (!(stageMediaWrap instanceof HTMLElement)) return

  if (motionRef.reduced) {
    killPageEnterTimeline()
    snapPageEnterLayerComplete()
    return
  }

  if (textOverlay && !textOverlay.hidden) {
    textOverlay.classList.add("is-visible")
  }

  const ease = MOTION.ease.settle
  const dur = MOTION.dur.mediaEnter(isIpadLike)

  pageEnterTimeline = gsap.timeline({
    onComplete: () => {
      pageEnterTimeline = null
      gsap.set(stageMediaWrap, { clearProps: "opacity,visibility,transform" })
      const clearEls = collectTextOverlayTweenTargets()
      if (clearEls.length) gsap.set(clearEls, { clearProps: "opacity,visibility,transform" })
      const innersDone = textTitle?.querySelectorAll?.(".title-word__inner") ?? []
      if (innersDone.length) gsap.set(innersDone, { clearProps: "opacity,visibility,transform" })
      if (textOverlay && !textOverlay.hidden) textOverlay.classList.add("is-visible")
    },
  })

  pageEnterTimeline.fromTo(
    stageMediaWrap,
    { autoAlpha: MOTION.alpha.reveal, y: 18, scale: MOTION.offset.mediaScaleIn, force3D: true },
    { autoAlpha: 1, y: 0, scale: 1, duration: dur, ease, force3D: true },
    0
  )
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

/** Remet l’étape 2 (puits + globe orbite) pour un nouvel affichage ou un retour arrière. */
function resetPuitsDualIframes() {
  const puits = document.getElementById("puits-frame")
  const earth = document.getElementById("earth-orbit-frame")
  if (puits instanceof HTMLIFrameElement) {
    gsap.killTweensOf(puits)
    gsap.set(puits, { clearProps: "opacity" })
    puits.style.pointerEvents = "auto"
    puits.style.opacity = "1"
  }
  if (earth instanceof HTMLIFrameElement) {
    gsap.killTweensOf(earth)
    gsap.set(earth, { clearProps: "opacity" })
    earth.style.pointerEvents = "none"
    earth.style.opacity = "0"
  }
  queueMicrotask(() => {
    try {
      puits?.contentWindow?.postMessage("reset", "*")
    } catch (_) {}
    try {
      earth?.contentWindow?.postMessage("reset", "*")
    } catch (_) {}
  })
}

function applySlideForIndex(index, meta = {}) {
  const kf = KEYFRAMES[index]

  const sphereSub = meta.sphereSubStep

  if (index !== 1) {
    const pf = document.getElementById("puits-frame")
    const ef = document.getElementById("earth-orbit-frame")
    queueMicrotask(() => {
      try {
        pf?.contentWindow?.postMessage("reset", "*")
      } catch (_) {
        /* iframe absente ou cross-origin */
      }
      try {
        ef?.contentWindow?.postMessage("reset", "*")
      } catch (_) {
        /* idem */
      }
    })
  }

  if (index !== 2) {
    queueMicrotask(() => postToSphereAplatieFrame("reset"))
  }

  if (index !== 3) {
    const gf = document.getElementById("page4-gravity-frame")
    queueMicrotask(() => {
      try {
        gf?.contentWindow?.postMessage("reset", "*")
      } catch (_) {
        /* iframe absente ou cross-origin */
      }
    })
  }

  if (epilogueActions instanceof HTMLElement) {
    epilogueActions.hidden = true
    epilogueActions.setAttribute("aria-hidden", "true")
  }

  if (index !== 5) {
    const cf = document.getElementById("conclusion-frame")
    queueMicrotask(() => {
      try {
        cf?.contentWindow?.postMessage("reset", "*")
      } catch (_) {
        /* iframe absente ou cross-origin */
      }
    })
  }

  if (index === 0) {
    introClipsWrap.hidden = false
    introClipsWrap.setAttribute("aria-hidden", "false")
    stageMediaWrap.setAttribute("aria-hidden", "false")
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    puitsPromptWrap.hidden = true
    puitsPromptWrap.setAttribute("aria-hidden", "true")
    topoPromptWrap.hidden = true
    topoPromptWrap.setAttribute("aria-hidden", "true")
    conclusionPromptWrap.hidden = true
    conclusionPromptWrap.setAttribute("aria-hidden", "true")
    page4AnimWrap.hidden = true
    page4AnimWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hideSphereAplatieMedia()
    return
  }

  introClipsWrap.hidden = true
  introClipsWrap.setAttribute("aria-hidden", "true")

  puitsPromptWrap.hidden = true
  puitsPromptWrap.setAttribute("aria-hidden", "true")

  topoPromptWrap.hidden = true
  topoPromptWrap.setAttribute("aria-hidden", "true")

  conclusionPromptWrap.hidden = true
  conclusionPromptWrap.setAttribute("aria-hidden", "true")

  page4AnimWrap.hidden = true
  page4AnimWrap.setAttribute("aria-hidden", "true")

  hideSphereAplatieMedia()

  if (kf.puitsPrompt) {
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    puitsPromptWrap.hidden = false
    puitsPromptWrap.setAttribute("aria-hidden", "false")
    resetPuitsDualIframes()
    return
  }

  if (kf.topoPrompt) {
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    conclusionPromptWrap.hidden = true
    conclusionPromptWrap.setAttribute("aria-hidden", "true")
    topoPromptWrap.hidden = false
    topoPromptWrap.setAttribute("aria-hidden", "false")
    queueMicrotask(() => {
      const fr = document.getElementById("topo-frame")
      if (fr instanceof HTMLIFrameElement && fr.contentWindow) {
        try {
          fr.contentWindow.TopoAnim?.reset?.()
        } catch (_) {
          /* cross-origin ou script pas encore chargé */
        }
      }
    })
    return
  }

  if (kf.epilogue) {
    introClipsWrap.hidden = true
    introClipsWrap.setAttribute("aria-hidden", "true")
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    puitsPromptWrap.hidden = true
    puitsPromptWrap.setAttribute("aria-hidden", "true")
    topoPromptWrap.hidden = true
    topoPromptWrap.setAttribute("aria-hidden", "true")
    conclusionPromptWrap.hidden = true
    conclusionPromptWrap.setAttribute("aria-hidden", "true")
    page4AnimWrap.hidden = true
    page4AnimWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hideSphereAplatieMedia()
    stageMediaWrap.setAttribute("aria-hidden", "true")
    if (epilogueActions instanceof HTMLElement) {
      epilogueActions.hidden = false
      epilogueActions.setAttribute("aria-hidden", "false")
    }
    if (btnEndPresentation instanceof HTMLButtonElement && !presentationEnded) {
      btnEndPresentation.disabled = false
    }
    return
  }

  stageMediaWrap.setAttribute("aria-hidden", "false")

  if (kf.conclusionPrompt) {
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    topoPromptWrap.hidden = true
    topoPromptWrap.setAttribute("aria-hidden", "true")
    conclusionPromptWrap.hidden = false
    conclusionPromptWrap.setAttribute("aria-hidden", "false")
    queueMicrotask(() => {
      const fr = document.getElementById("conclusion-frame")
      if (fr instanceof HTMLIFrameElement && fr.contentWindow) {
        try {
          fr.contentWindow.ConclusionAnim?.reset?.()
          fr.contentWindow.postMessage("reset", "*")
        } catch (_) {
          /* cross-origin ou script pas encore chargé */
        }
      }
    })
    return
  }

  if (kf.gravitySpherePrompt) {
    eratoPromptWrap.hidden = true
    eratoPromptWrap.setAttribute("aria-hidden", "true")
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    page4AnimWrap.hidden = false
    page4AnimWrap.setAttribute("aria-hidden", "false")
    queueMicrotask(() => {
      const fr = document.getElementById("page4-gravity-frame")
      if (fr instanceof HTMLIFrameElement && fr.contentWindow) {
        try {
          fr.contentWindow.postMessage("reset", "*")
        } catch (_) {
          /* cross-origin ou script pas encore chargé */
        }
      }
    })
    return
  }

  if (kf.eratoTwoStep) {
    const showIframe = sphereSub === 1
    stageTilesRoot.hidden = true
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
    applySphereAplatieStep(sphereSub ?? 0)
    return
  }

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
  const isEpilogue = isEpilogueKeyframe(kf)
  let layout = "split"
  if (sectionIndex === 0) layout = "intro"
  else if (isEpilogue) layout = "epilogue"
  else if (kf?.sphereTwoStep || kf?.eratoTwoStep) layout = "sphere"
  if (appRoot) {
    appRoot.dataset.layout = layout
    appRoot.dataset.step = String(sectionIndex + 1)
    appRoot.classList.toggle("page2-layout", !!kf?.puitsPrompt || !!kf?.gravitySpherePrompt)
    appRoot.classList.toggle("app--epilogue", isEpilogue)
  }
  document.body.classList.toggle("app--epilogue", isEpilogue)
  if (textOverlay instanceof HTMLElement) {
    textOverlay.classList.toggle("page2-text", !!kf?.puitsPrompt || !!kf?.gravitySpherePrompt)
  }

  const spherePage = !!kf?.sphereTwoStep
  if (progressTrack instanceof HTMLElement) {
    progressTrack.hidden = spherePage || isEpilogue
  }
  if (dotsNav instanceof HTMLElement) {
    dotsNav.hidden = isEpilogue
    dotsNav.setAttribute("aria-hidden", isEpilogue ? "true" : "false")
  }
  if (textOverlay) {
    textOverlay.hidden = false
    textOverlay.setAttribute("aria-hidden", "false")
  }

  const navIndex = keyframeToNavIndex(sectionIndex)
  const pct = ((navIndex + 1) / NAV_SECTION_COUNT) * 100
  if (progressBar instanceof HTMLElement) {
    if (motionRef.reduced) {
      gsap.killTweensOf(progressBar)
      progressBar.style.width = `${pct}%`
    } else {
      gsap.to(progressBar, {
        width: `${pct}%`,
        duration: isIpadLike ? 0.34 : 0.48,
        ease: MOTION.ease.out,
        overwrite: "auto",
      })
    }
  }

  dots.forEach((d) => {
    const dotIdx = Number.parseInt(d.dataset.section ?? "", 10)
    const active = dotIdx === sectionIndex
    d.classList.toggle("is-active", active)
    d.setAttribute("aria-current", active ? "true" : "false")
  })
  updateDotsVisualState(sectionIndex, dots, { reducedMotion: motionRef.reduced })

  if (sectionLabelEl) {
    sectionLabelEl.textContent = ""
  }
  if (stepIndicatorEl) {
    stepIndicatorEl.textContent = isEpilogue
      ? ""
      : `Étape ${navIndex + 1} / ${NAV_SECTION_COUNT}`
  }
  updateNavDock(sectionIndex)
  updateScrollHint(sectionIndex)
  setStarsBackgroundActive(!document.body.classList.contains("intro-stars-phase"))
}

const k0 = KEYFRAMES[0]
updateUi(0)
applySlideForIndex(0, {})
applyTextIfChanged(k0.textSection)
if (!motionRef.reduced) primePageEnterHidden(0)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    triggerPageEnterEffects()
  })
})

scrollApi = initScroll({
  reducedMotion: motionRef.reduced,
  onPageTransition: ({ fromIndex, toIndex, kf, meta = {}, direction, subStepOnly, done }) => {
    killPageEnterTimeline()

    const applySection = () => {
      applySlideForIndex(toIndex, meta)
      if (subStepOnly) applyTextIfChanged(kf.textSection)
      else applyTextForSection(kf.textSection)
      updateUi(toIndex)
    }

    runPageTransition({
      direction,
      subStepOnly,
      reducedMotion: motionRef.reduced,
      applySection,
      done,
      getTextTargets: collectTextOverlayTweenTargets,
      stageMediaWrap,
      textOverlay,
      transitionRoot: pageTransitionRoot,
      isIpadLike,
    })
  },
  onTransitionComplete: (_idx, _kf, meta = {}) => {
    if (meta.subStepOnly) return
    resetSectionAnimClickIndex()
  },
  onProgressUi: () => {},
})

const INTRO_AUTO_EXIT_MS = 5000
const introStarsFrameEl = document.getElementById("intro-stars-frame")
const introTapCatcherEl = document.getElementById("intro-tap-catcher")

let introExited = false
/** Tant que true, la navigation par swipe / clavier est bloquée (phase intro). */
let introActive = introStarsFrameEl instanceof HTMLIFrameElement
/** true quand l’iframe signale la fin de la séquence (idle + globes prêts). */
let introReady = false
let introStarsWireDone = false
let introGlobesPrimed = false
let introAutoExitTimer = 0

function clearIntroAutoExitTimer() {
  if (introAutoExitTimer) {
    window.clearTimeout(introAutoExitTimer)
    introAutoExitTimer = 0
  }
}

function primeIntroGlobesAndHint() {
  if (introGlobesPrimed) return
  introGlobesPrimed = true
  document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
    if (!(el instanceof HTMLIFrameElement)) return
    const ds = el.dataset.src
    if (ds && (!el.src || el.src === "about:blank")) el.src = ds
  })
  const hintEl = document.getElementById("scroll-hint")
  if (hintEl instanceof HTMLElement) hintEl.style.opacity = "1"
}

function onIntroWindowClick(e) {
  if (!document.body.classList.contains("intro-stars-phase") || introExited) return
  if (
    e.target instanceof Element &&
    e.target.closest(
      "#nav-dock, #btn-prev, #btn-home, #section-dots, #epilogue-actions, #btn-end-presentation, .section-dot, .nav-dock__item"
    )
  )
    return
  e.preventDefault()
  e.stopPropagation()
  exitIntro()
}

function onIntroTouchEnd() {
  if (!document.body.classList.contains("intro-stars-phase") || introExited) return
  exitIntro()
}

function onIntroKeydown(e) {
  if (!document.body.classList.contains("intro-stars-phase") || introExited) return
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
    introReady = true
    return
  }
  if (e.data === "intro-tap" || e.data === "intro-complete-tap") {
    if (document.body.classList.contains("intro-stars-phase")) exitIntro()
  }
}

function onIntroTapCatcherPointer(e) {
  if (!document.body.classList.contains("intro-stars-phase") || introExited) return
  if (
    e.target instanceof Element &&
    e.target.closest(
      "#nav-dock, #btn-prev, #btn-home, #section-dots, #epilogue-actions, #btn-end-presentation, .section-dot, .nav-dock__item"
    )
  )
    return
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
    introTapCatcherEl.removeEventListener("pointerdown", onIntroTapCatcherPointer, { passive: false })
    introTapCatcherEl.removeEventListener("click", onIntroTapCatcherPointer, true)
  }
}

function exitIntro() {
  if (introExited) return
  introExited = true
  clearIntroAutoExitTimer()
  detachIntroInteractionListeners()

  const frame = document.getElementById("intro-stars-frame")
  if (!(frame instanceof HTMLIFrameElement)) {
    introActive = false
    document.body.classList.remove("intro-stars-phase")
    document.body.style.overflow = ""
    setStarsBackgroundActive(true)
    const namesOnly = document.getElementById("persistent-names")
    if (namesOnly instanceof HTMLElement) {
      namesOnly.style.opacity = "1"
      namesOnly.setAttribute("aria-hidden", "false")
    }
    return
  }

  try {
    frame.contentWindow?.IntroStars?.exit?.()
  } catch (_) {
    /* iframe cross-origin ou API absente */
  }

  document.querySelectorAll("#intro-clips-wrap iframe[data-src]").forEach((el) => {
    if (!(el instanceof HTMLIFrameElement)) return
    const ds = el.dataset.src
    if (ds && (!el.src || el.src === "about:blank")) el.src = ds
  })

  snapPageEnterLayerComplete()

  const clipFrames = () =>
    [...document.querySelectorAll("#intro-clips-wrap iframe.intro-clip-frame")]

  for (const f of clipFrames()) {
    f.style.transformOrigin = "center center"
    f.style.transform = "scale(0.05)"
    f.style.transition = "none"
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const f of clipFrames()) {
        f.style.transition = "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
        f.style.transform = "scale(1)"
      }
    })
  })

  const hint = document.getElementById("scroll-hint")
  if (hint instanceof HTMLElement) hint.style.opacity = "0"

  window.setTimeout(() => {
    frame.style.transition = "opacity 0.8s ease"
    frame.style.opacity = "0"
    window.setTimeout(() => {
      frame.remove()
      document.body.classList.remove("intro-stars-phase")
      document.body.style.overflow = ""

      setStarsBackgroundActive(true)
      introActive = false

      const names = document.getElementById("persistent-names")
      if (names instanceof HTMLElement) {
        names.style.opacity = "1"
        names.setAttribute("aria-hidden", "false")
      }

      const hintAfter = document.getElementById("scroll-hint")
      if (hintAfter instanceof HTMLElement) hintAfter.style.opacity = "1"
    }, 800)
  }, 100)

  scrollToSection(0, motionRef.reduced, scrollApi)
}

function initIntroStarsOverlay() {
  const frame = document.getElementById("intro-stars-frame")
  if (!(frame instanceof HTMLIFrameElement)) {
    introActive = false
    introExited = true
    return
  }

  introActive = true
  introExited = false
  introReady = false
  introGlobesPrimed = false
  document.body.classList.add("intro-stars-phase")
  document.body.style.overflow = "hidden"

  const clipFrames = () =>
    [...document.querySelectorAll("#intro-clips-wrap iframe.intro-clip-frame")]

  for (const el of clipFrames()) {
    el.style.transformOrigin = "center center"
    el.style.transform = "scale(0.05)"
  }

  function wireIntroReady() {
    if (introStarsWireDone) return
    introStarsWireDone = true
    const api = frame.contentWindow?.IntroStars
    const scheduleAutoExit = () => {
      clearIntroAutoExitTimer()
      introAutoExitTimer = window.setTimeout(() => {
        introAutoExitTimer = 0
        if (!introExited) exitIntro()
      }, INTRO_AUTO_EXIT_MS)
    }
    if (api && typeof api.onComplete === "function") {
      let done = false
      api.onComplete(() => {
        if (done) return
        done = true
        primeIntroGlobesAndHint()
        introReady = true
        scheduleAutoExit()
      })
    } else {
      primeIntroGlobesAndHint()
      introReady = true
      scheduleAutoExit()
    }
  }

  if (frame.contentDocument?.readyState === "complete") queueMicrotask(wireIntroReady)
  else frame.addEventListener("load", () => queueMicrotask(wireIntroReady), { once: true })

  attachIntroInteractionListeners()
}

const NAV_DELAY_MS = 500
let lastNavTime = 0
let navLocked = false

/** Registre des animations par index de section (`KEYFRAMES` / `scrollIndex`). */
const STEP_ANIMATIONS = {
  0: [],
  1: [
    () => triggerIframeAnim("puits-frame"),
    () => {
      const puits = document.getElementById("puits-frame")
      const earth = document.getElementById("earth-orbit-frame")
      if (!(puits instanceof HTMLElement) || !(earth instanceof HTMLIFrameElement)) return

      gsap.killTweensOf([puits, earth])
      gsap.set(earth, { autoAlpha: 0, pointerEvents: "none" })

      const tl = gsap.timeline()
      tl.to(puits, {
        autoAlpha: 0,
        duration: MOTION.dur.iframeCrossfade,
        ease: MOTION.ease.inOut,
        onComplete: () => {
          puits.style.pointerEvents = "none"
        },
      })
      tl.to(
        earth,
        {
          autoAlpha: 1,
          duration: MOTION.dur.iframeCrossfade,
          ease: MOTION.ease.settle,
          onStart: () => {
            earth.style.pointerEvents = "auto"
          },
        },
        MOTION.dur.iframeCrossfade * 0.35
      )
      tl.add(() => {
        earth.contentWindow?.postMessage("play", "*")
      }, MOTION.dur.iframeCrossfade * 0.5)
    },
  ],
  2: [],
  3: [() => triggerIframeAnim("page4-gravity-frame")],
  4: [() => triggerIframeAnim("topo-frame")],
  5: [() => triggerIframeAnim("conclusion-frame")],
  6: [],
}

function triggerIframeAnim(iframeId) {
  const f = document.getElementById(iframeId)
  f?.contentWindow?.postMessage("play", "*")
}

/** Nombre d’animations déjà déclenchées sur la section courante (hors intro / hors panneaux two-step). */
let sectionAnimClickIndex = 0

function resetSectionAnimClickIndex() {
  sectionAnimClickIndex = 0
}

function getCurrentKeyframe() {
  const i = scrollApi?.getIndex?.() ?? 0
  return KEYFRAMES[i]
}

function currentSectionUsesScrollTwoStep() {
  const kf = getCurrentKeyframe()
  return !!(kf?.sphereTwoStep || kf?.eratoTwoStep)
}

function goToNextStep() {
  scrollApi?.stepBy(1)
}

function goToPrevStep() {
  scrollApi?.stepBy(-1)
}

/** Sommaire (étape 0) : saut direct vers une partie. */
function goToSectionIndex(index) {
  if (introActive || presentationEnded || presentationEnding) return
  const now = Date.now()
  if (navLocked || now - lastNavTime < NAV_DELAY_MS) return
  navLocked = true
  lastNavTime = now
  resetSectionAnimClickIndex()
  scrollToSection(index, motionRef.reduced, scrollApi)
  window.setTimeout(() => {
    navLocked = false
  }, NAV_DELAY_MS)
}

function onSommaireItemActivate(e) {
  if (!(textOverlay instanceof HTMLElement)) return
  if (!textOverlay.classList.contains("text-overlay--sommaire")) return
  if ((scrollApi?.getIndex?.() ?? 0) !== 0) return

  const btn = e.target instanceof Element ? e.target.closest(".text-overlay__sommaire-btn") : null
  if (!(btn instanceof HTMLButtonElement)) return

  const idx = Number.parseInt(btn.dataset.sectionIndex ?? "", 10)
  if (!Number.isFinite(idx)) return

  e.preventDefault()
  e.stopPropagation()
  goToSectionIndex(idx)
}

/**
 * Avance d’une « unité » : soit l’animation suivante de l’étape, soit passage à l’étape suivante.
 * Intro (index 0) et panneaux `sphereTwoStep` / `eratoTwoStep` restent gérés comme avant (`stepBy`).
 */
function tryAdvanceForwardFromUserGesture(now) {
  if (navLocked || now - lastNavTime < NAV_DELAY_MS) return
  if (presentationEnded || presentationEnding) return

  const idx = scrollApi?.getIndex?.() ?? 0

  if (isEpilogueKeyframe(KEYFRAMES[idx])) return

  if (idx === 0) {
    navLocked = true
    lastNavTime = now
    goToNextStep()
    window.setTimeout(() => {
      navLocked = false
    }, NAV_DELAY_MS)
    return
  }

  if (currentSectionUsesScrollTwoStep()) {
    navLocked = true
    lastNavTime = now
    goToNextStep()
    window.setTimeout(() => {
      navLocked = false
    }, NAV_DELAY_MS)
    return
  }

  const anims = STEP_ANIMATIONS[idx] || []

  if (sectionAnimClickIndex < anims.length) {
    navLocked = true
    lastNavTime = now
    const fn = anims[sectionAnimClickIndex]
    if (typeof fn === "function") fn()
    sectionAnimClickIndex++
    window.setTimeout(() => {
      navLocked = false
    }, NAV_DELAY_MS)
    return
  }

  navLocked = true
  lastNavTime = now
  sectionAnimClickIndex = 0
  goToNextStep()
  window.setTimeout(() => {
    navLocked = false
  }, NAV_DELAY_MS)
}

function triggerBackwardNav() {
  if (introActive || presentationEnded || presentationEnding) return
  const now = Date.now()
  if (navLocked || now - lastNavTime < NAV_DELAY_MS) return
  navLocked = true
  lastNavTime = now
  resetSectionAnimClickIndex()
  playBackNavAnimation(() => {
    goToPrevStep()
    window.setTimeout(() => {
      navLocked = false
    }, NAV_DELAY_MS)
  })
}

function handleNav(direction = "forward") {
  if (introActive) return
  const now = Date.now()
  if (navLocked || now - lastNavTime < NAV_DELAY_MS) return
  if (direction === "backward") {
    triggerBackwardNav()
    return
  }
  tryAdvanceForwardFromUserGesture(now)
}

function targetExcludesGlobalNav(el) {
  if (!(el instanceof Element)) return true
  if (el.isContentEditable || el.closest("[contenteditable]")) return true
  return !!el.closest(
    "#nav-dock, #btn-home, #section-dots, #btn-prev, #epilogue-actions, #btn-end-presentation, .nav-dock__item, .nav-dock__earth-frame, .section-dot, .nav-dot, .nav-btn, button[data-nav], a, button, [role=\"button\"], input, textarea, select, label, iframe, #quiz-frame"
  )
}

function onGlobalClickNav(e) {
  if (targetExcludesGlobalNav(/** @type {EventTarget} */ (e.target))) return
  handleNav("forward")
}

let touchNavStartX = 0
let touchNavStartY = 0

function onTouchStartNav(e) {
  if (e.touches.length !== 1) return
  touchNavStartX = e.touches[0].clientX
  touchNavStartY = e.touches[0].clientY
}

function onTouchEndNav(e) {
  if (!e.changedTouches.length) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchNavStartX
  const dy = t.clientY - touchNavStartY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist >= 15) return
  if (targetExcludesGlobalNav(/** @type {EventTarget} */ (t.target))) return
  handleNav("forward")
}

window.addEventListener("click", onGlobalClickNav, true)
window.addEventListener("touchstart", onTouchStartNav, { passive: true })
window.addEventListener("touchend", onTouchEndNav, { passive: true })

if (textBody instanceof HTMLElement) {
  textBody.addEventListener("click", onSommaireItemActivate)
}

window.addEventListener(
  "scroll",
  (e) => {
    e.preventDefault()
  },
  { passive: false, capture: true }
)

document.addEventListener(
  "touchmove",
  (e) => {
    const el = e.target
    if (el instanceof Element && el.closest("iframe")) return
    e.preventDefault()
  },
  { passive: false, capture: true }
)

initIntroStarsOverlay()

dots.forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number.parseInt(btn.dataset.section, 10)
    resetSectionAnimClickIndex()
    scrollToSection(idx, motionRef.reduced, scrollApi)
  })
})

if (btnPrev instanceof HTMLButtonElement) {
  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation()
    if (introActive || navLocked || btnPrev.classList.contains("is-animating")) return
    triggerBackwardNav()
  })
}

function showPresentationEndSommaire() {
  if (btnPrev instanceof HTMLButtonElement) btnPrev.hidden = true
  if (navDockSep instanceof HTMLElement) navDockSep.hidden = true

  if (navDock instanceof HTMLElement) {
    navDock.hidden = false
    navDock.classList.add("is-visible", "nav-dock--end-only")
    navDock.setAttribute("aria-hidden", "false")
  }
  postToNavDockEarth("resume")
}

function returnToSommaireFromEnd() {
  if (!presentationEnded) return

  presentationEnded = false
  document.body.classList.remove("presentation-ended")

  if (presentationBlackout instanceof HTMLElement) {
    presentationBlackout.hidden = true
    presentationBlackout.setAttribute("aria-hidden", "true")
    gsap.set(presentationBlackout, { clearProps: "opacity" })
  }

  if (navDock instanceof HTMLElement) {
    navDock.classList.remove("nav-dock--end-only")
  }
  if (btnPrev instanceof HTMLButtonElement) btnPrev.hidden = false
  if (navDockSep instanceof HTMLElement) navDockSep.hidden = false

  restartStarsAfterFinale()

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

async function playPresentationEnd() {
  if (presentationEnded || presentationEnding) return
  const idx = scrollApi?.getIndex?.() ?? -1
  if (!isEpilogueKeyframe(KEYFRAMES[idx])) return

  presentationEnding = true
  if (btnEndPresentation instanceof HTMLButtonElement) btnEndPresentation.disabled = true
  document.body.classList.add("presentation-ending", "scroll-locked")

  gsap.killTweensOf([textOverlay, epilogueActions].filter(Boolean))
  gsap.to([textOverlay, epilogueActions].filter(Boolean), {
    autoAlpha: 0,
    duration: motionRef.reduced ? 0.12 : 0.3,
    ease: MOTION.ease.in,
  })

  await runPresentationFinale({ durationSec: motionRef.reduced ? 0 : 1.65 })

  if (presentationBlackout instanceof HTMLElement) {
    presentationBlackout.hidden = false
    presentationBlackout.setAttribute("aria-hidden", "false")
    gsap.set(presentationBlackout, { opacity: 1 })
  }

  presentationEnding = false
  presentationEnded = true
  document.body.classList.remove("presentation-ending", "scroll-locked")
  document.body.classList.add("presentation-ended")
  showPresentationEndSommaire()
  updateScrollHint(idx)
}

if (btnEndPresentation instanceof HTMLButtonElement) {
  btnEndPresentation.addEventListener("click", (e) => {
    e.stopPropagation()
    e.preventDefault()
    playPresentationEnd()
  })
}

if (btnHome instanceof HTMLButtonElement) {
  btnHome.addEventListener("click", (e) => {
    e.stopPropagation()
    if (introActive || navLocked || btnHome.classList.contains("is-animating")) return
    if (presentationEnded) {
      playHomeNavAnimation(() => returnToSommaireFromEnd())
      return
    }
    if ((scrollApi?.getIndex?.() ?? 0) === 0) return
    playHomeNavAnimation(() => goToSectionIndex(0))
  })
}

window.addEventListener("load", () => {
  scrollApi?.refresh()
})

window.addEventListener("keydown", (e) => {
  if (e.defaultPrevented) return
  const t = e.target
  if (t && (t.isContentEditable || (t.closest && t.closest("input, textarea, select")))) return

  const forwardKeys = ["ArrowRight", "ArrowDown", "Enter", "PageDown"]
  if (e.key === " " || forwardKeys.includes(e.key)) {
    e.preventDefault()
    handleNav("forward")
    return
  }

  const backKeys = ["ArrowLeft", "ArrowUp", "PageUp"]
  if (backKeys.includes(e.key)) {
    e.preventDefault()
    handleNav("backward")
  }
})
