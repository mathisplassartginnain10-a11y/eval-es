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
  setStarsBackgroundActive,
  setStarsBackgroundReducedMotion,
  setConclusionStarfieldEnabled,
  pulseConclusionWarp,
} from "./src/starsBg.js"
import { show, hide, escapeHtml } from "./src/domHelpers.js"
import { postToFrame, postToFrameById } from "./src/iframeHelpers.js"
import { NAV_DELAY_MS, INTRO_AUTO_EXIT_MS } from "./src/constants.js"
import { createNavState, canNavigate, withNavLock } from "./src/navHelpers.js"
import { createNavDockController } from "./src/navDock.js"
import { createPresentationEnd } from "./src/presentationEnd.js"
import { createNavController } from "./src/navController.js"
import { createIntroOverlay } from "./src/introOverlay.js"

const navState = createNavState()

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
}

const isIpadLike = detectIpadLike()
configureGsapPerformance({ reducedMotion: motionRef.reduced, isIpad: isIpadLike })
if (isIpadLike && !motionRef.reduced) {
  gsap.globalTimeline.timeScale(1.06)
}
if (isIpadLike) {
  document.documentElement.classList.add("is-ipad")
}
const isCoarsePointer =
  window.matchMedia?.("(pointer: coarse)")?.matches ||
  navigator.maxTouchPoints > 1
if (isCoarsePointer) {
  document.documentElement.classList.add("is-touch")
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

const presentationEndState = { ended: false, ending: false }

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
  postToFrameById("sphere-aplatie-frame", msg)
}

function hideSphereAplatieMedia() {
  hide(sphereAplatieWrap)
  if (stageSphereHost) {
    hide(stageSphereHost)
  }
}

function applySphereAplatieStep(sphereSub) {
  const play = sphereSub === 1
  stageTilesRoot.hidden = true
  stageSingle.hidden = true
  slideStage.clear()
  hide(eratoPromptWrap)
  show(sphereAplatieWrap)
  queueMicrotask(() => {
    if (!play) {
      postToSphereAplatieFrame("reset")
      return
    }
    if (motionRef.reduced) {
      postToSphereAplatieFrame("reset")
      try {
        document.getElementById("sphere-aplatie-frame")?.contentWindow?.SphereAplatieAnim?.seek(1)
      } catch (e) {
        if (import.meta.env?.DEV) console.warn(e)
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
const introStarsFrameEl = document.getElementById("intro-stars-frame")
const introTapCatcherEl = document.getElementById("intro-tap-catcher")

const introState = {
  active: introStarsFrameEl instanceof HTMLIFrameElement,
  exited: false,
  ready: false,
  wireDone: false,
  globesPrimed: false,
  autoExitTimer: 0,
}

const navDockController = createNavDockController({
  gsap,
  motionRef,
  MOTION,
  navDock,
  btnPrev,
  btnHome,
  KEYFRAMES,
  getIntroActive: () => introState.active,
})
const { updateNavDock, playBackNavAnimation, playHomeNavAnimation, postToNavDockEarth } = navDockController

function updateScrollHint(sectionIndex) {
  if (!(scrollHintEl instanceof HTMLElement)) return
  if (document.body.classList.contains("intro-stars-phase") || presentationEndState.ended || presentationEndState.ending) {
    hide(scrollHintEl)
    gsap.set(scrollHintEl, { opacity: 0 })
    return
  }
  const isEpilogue = isEpilogueKeyframe(KEYFRAMES[sectionIndex])
  const visible = !isEpilogue
  if (visible) show(scrollHintEl)
  else hide(scrollHintEl)
  gsap.set(scrollHintEl, { opacity: visible ? 1 : 0 })
}

bindViewportResizeDebounced(() => {
  scrollApi?.refresh()
})
initLayoutEntranceAnimations({ reducedMotion: motionRef.reduced })
setupFinePointerHoverNudges()

let lastTextKey = null
/** @type {ReturnType<initScroll> | null} */
let scrollApi = null

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

/** Remet l'étape 2 (puits + globe orbite) pour un nouvel affichage ou un retour arrière. */
function resetPuitsDualIframes() {
  const puits = document.getElementById("puits-frame")
  const earth = document.getElementById("earth-orbit-frame")
  /* Le crossfade utilise `autoAlpha` (opacity + visibility). Il faut donc reset les deux,
     sinon au retour sur l'étape 2 puits reste `visibility:hidden` et earth `visibility:visible`. */
  if (puits instanceof HTMLIFrameElement) {
    gsap.killTweensOf(puits)
    gsap.set(puits, { clearProps: "opacity,visibility" })
    gsap.set(puits, { pointerEvents: "auto", autoAlpha: 1 })
  }
  if (earth instanceof HTMLIFrameElement) {
    gsap.killTweensOf(earth)
    gsap.set(earth, { clearProps: "opacity,visibility" })
    gsap.set(earth, { pointerEvents: "none", autoAlpha: 0 })
  }
  queueMicrotask(() => {
    postToFrame(puits, "reset")
    postToFrame(earth, "reset")
  })
}

function applySlideForIndex(index, meta = {}) {
  const kf = KEYFRAMES[index]

  const sphereSub = meta.sphereSubStep

  if (!kf?.puitsPrompt) {
    queueMicrotask(() => {
      postToFrameById("puits-frame", "reset")
      postToFrameById("earth-orbit-frame", "reset")
    })
  }

  if (!kf?.sphereTwoStep) {
    queueMicrotask(() => postToSphereAplatieFrame("reset"))
  }

  if (!kf?.gravitySpherePrompt) {
    queueMicrotask(() => postToFrameById("page4-gravity-frame", "reset"))
  }

  if (!kf?.epilogue) {
    hide(epilogueActions)
  }

  if (!kf?.conclusionPrompt) {
    setConclusionStarfieldEnabled(false)
    queueMicrotask(() => postToFrameById("conclusion-frame", "reset"))
  }

  if (index === 0) {
    show(introClipsWrap)
    stageMediaWrap.setAttribute("aria-hidden", "false")
    hide(eratoPromptWrap)
    hide(puitsPromptWrap)
    hide(topoPromptWrap)
    hide(conclusionPromptWrap)
    hide(page4AnimWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hideSphereAplatieMedia()
    return
  }

  hide(introClipsWrap)

  hide(puitsPromptWrap)

  hide(topoPromptWrap)

  hide(conclusionPromptWrap)

  hide(page4AnimWrap)

  hideSphereAplatieMedia()

  if (kf.puitsPrompt) {
    hide(eratoPromptWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    show(puitsPromptWrap)
    resetPuitsDualIframes()
    return
  }

  if (kf.topoPrompt) {
    hide(eratoPromptWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hide(conclusionPromptWrap)
    show(topoPromptWrap)
    queueMicrotask(() => {
      const fr = document.getElementById("topo-frame")
      if (fr instanceof HTMLIFrameElement && fr.contentWindow) {
        try {
          fr.contentWindow.TopoAnim?.reset?.()
        } catch (e) {
          if (import.meta.env?.DEV) console.warn(e)
        }
      }
    })
    return
  }

  if (kf.epilogue) {
    hide(introClipsWrap)
    hide(eratoPromptWrap)
    hide(puitsPromptWrap)
    hide(topoPromptWrap)
    hide(conclusionPromptWrap)
    hide(page4AnimWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hideSphereAplatieMedia()
    stageMediaWrap.setAttribute("aria-hidden", "true")
    if (epilogueActions instanceof HTMLElement && !presentationEndState.ended && !presentationEndState.ending) {
      show(epilogueActions)
    }
    if (btnEndPresentation instanceof HTMLButtonElement) {
      btnEndPresentation.disabled = presentationEndState.ended || presentationEndState.ending
    }
    return
  }

  stageMediaWrap.setAttribute("aria-hidden", "false")

  if (kf.conclusionPrompt) {
    setConclusionStarfieldEnabled(true)
    hide(eratoPromptWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    hide(topoPromptWrap)
    show(conclusionPromptWrap)
    queueMicrotask(() => {
      const fr = document.getElementById("conclusion-frame")
      if (fr instanceof HTMLIFrameElement) {
        fr.contentWindow?.ConclusionAnim?.reset?.()
        postToFrame(fr, "reset")
      }
    })
    return
  }

  if (kf.gravitySpherePrompt) {
    hide(eratoPromptWrap)
    stageTilesRoot.hidden = true
    stageSingle.hidden = true
    slideStage.clear()
    show(page4AnimWrap)
    queueMicrotask(() => postToFrameById("page4-gravity-frame", "reset"))
    return
  }

  if (kf.eratoTwoStep) {
    const showIframe = sphereSub === 1
    stageTilesRoot.hidden = true
    if (!showIframe) {
      hide(eratoPromptWrap)
      stageSingle.hidden = false
      slideStage.apply(keyframeToSlideMedia(kf))
    } else {
      slideStage.clear()
      stageSingle.hidden = true
      show(eratoPromptWrap)
    }
    return
  }

  hide(eratoPromptWrap)

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
    show(textOverlay)
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


const introOverlay = createIntroOverlay({
  gsap,
  motionRef,
  state: introState,
  introStarsFrameEl,
  introTapCatcherEl,
  introAutoExitMs: INTRO_AUTO_EXIT_MS,
  setStarsBackgroundActive,
  scrollToSection,
  getScrollApi: () => scrollApi,
  snapPageEnterLayerComplete,
})
const { initIntroStarsOverlay, exitIntro, primeIntroGlobesAndHint } = introOverlay


/** Registre des animations par index de section (`KEYFRAMES` / `scrollIndex`). */
const STEP_ANIMATIONS = {
  0: [],
  1: [
    /* Sub-étape 1 : animation principale des deux puits (Syène + Alexandrie). */
    () => ensureAndPost("puits-frame", "play"),
    /* Sub-étape 2 : schéma Ératosthène plein cadre à l'intérieur de l'iframe puits. */
    () => ensureAndPost("puits-frame", "schema"),
    /* Sub-étape 3 : crossfade vers la Terre orbitale + fil méridien. */
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
        postToFrame(earth, "play")
      }, MOTION.dur.iframeCrossfade * 0.5)
    },
  ],
  2: [],
  3: [() => triggerIframeAnim("page4-gravity-frame")],
  4: [() => triggerIframeAnim("topo-frame")],
  5: [() => triggerIframeAnim("conclusion-frame")],
  6: [],
}

function ensureIframeLoaded(iframeId) {
  const fr = document.getElementById(iframeId)
  if (!(fr instanceof HTMLIFrameElement)) return null
  const ds = fr.dataset.src
  if (ds && (!fr.src || fr.src === "about:blank")) {
    fr.src = ds
  }
  return fr
}

function ensureAndPost(iframeId, msg) {
  const fr = ensureIframeLoaded(iframeId)
  if (!fr) return
  const send = () => {
    postToFrame(fr, "resume")
    postToFrame(fr, msg)
  }
  if (fr.contentDocument && fr.contentDocument.readyState === "complete") {
    send()
    return
  }
  fr.addEventListener("load", send, { once: true })
  send()
}

function triggerIframeAnim(iframeId) {
  ensureAndPost(iframeId, "play")
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

const navController = createNavController({
  navState,
  navDelayMs: NAV_DELAY_MS,
  motionRef,
  KEYFRAMES,
  STEP_ANIMATIONS,
  presentationEndState,
  getScrollApi: () => scrollApi,
  getIntroActive: () => introState.active,
  getCurrentKeyframe,
  getSectionAnimClickIndex: () => sectionAnimClickIndex,
  setSectionAnimClickIndex: (v) => {
    sectionAnimClickIndex = v
  },
  resetSectionAnimClickIndex,
  playBackNavAnimation,
})
const {
  goToNextStep,
  goToPrevStep,
  goToSectionIndex,
  tryAdvanceForwardFromUserGesture,
  triggerBackwardNav,
  handleNav,
  onGlobalClickNav,
  onTouchStartNav,
  onTouchEndNav,
} = navController

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

window.addEventListener("click", onGlobalClickNav, true)
window.addEventListener("touchstart", onTouchStartNav, { passive: true })
window.addEventListener("touchend", onTouchEndNav, { passive: true })

if (textBody instanceof HTMLElement) {
  textBody.addEventListener("click", onSommaireItemActivate)
}

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
    if (introState.active || navState.locked || btnPrev.classList.contains("is-animating")) return
    triggerBackwardNav()
  })
}

const presentationEnd = createPresentationEnd({
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
  state: presentationEndState,
  postToNavDockEarth,
  restartStarsAfterFinale,
  getScrollApi: () => scrollApi,
  applySlideForIndex,
  applyTextForSection,
  updateUi,
  updateScrollHint,
  resetSectionAnimClickIndex,
  primePageEnterHidden,
  triggerPageEnterEffects,
})
const { revealPresentationEnd, returnToSommaireFromEnd } = presentationEnd

if (btnEndPresentation instanceof HTMLButtonElement) {
  btnEndPresentation.addEventListener("click", (e) => {
    e.stopPropagation()
    e.preventDefault()
    revealPresentationEnd()
  })
}

if (btnHome instanceof HTMLButtonElement) {
  btnHome.addEventListener("click", (e) => {
    e.stopPropagation()
    if (introState.active || navState.locked || btnHome.classList.contains("is-animating")) return
    if (presentationEndState.ended) {
      playHomeNavAnimation(() => returnToSommaireFromEnd())
      return
    }
    if ((scrollApi?.getIndex?.() ?? 0) === 0) return
    playHomeNavAnimation(() => goToSectionIndex(0))
  })
}

window.addEventListener("message", (e) => {
  const data = e.data
  if (!data || typeof data !== "object" || data.type !== "conclusion-warp" || data.action !== "start") {
    return
  }
  if ((scrollApi?.getIndex?.() ?? -1) !== 5) return
  pulseConclusionWarp()
})

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
