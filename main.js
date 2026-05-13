import { createSlideStage } from "./src/slideStage.js"
import { initScroll, scrollToSection, SECTION_COUNT } from "./src/scroll.js"
import { KEYFRAMES, keyframeToSlideMedia, mediaSpecToSlideMedia } from "./src/sections.js"
import { createSphereAnim } from "./src/sphereAnim.js"
import { CONTENT, SECTION_LABELS } from "./src/content.js"

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  motionRef.reduced = e.matches
})

const appRoot = document.getElementById("app")
const progressBar = document.getElementById("progress-bar")
const textOverlay = document.getElementById("text-overlay")
const textKicker = document.getElementById("text-kicker")
const textTitle = document.getElementById("text-title")
const textSubtitle = document.getElementById("text-subtitle")
const textBody = document.getElementById("text-body")
const textCredit = document.getElementById("text-credit")
const sectionLabelEl = document.getElementById("section-label")
const stepIndicatorEl = document.getElementById("step-indicator")
const scrollHint = document.getElementById("scroll-hint")
const dotsNav = document.getElementById("section-dots")
const stageSingle = document.getElementById("stage-single")
const stageSphereHost = document.getElementById("stage-sphere-host")
const stageTilesRoot = document.getElementById("stage-tiles")
const eratoPromptWrap = document.getElementById("erato-prompt-wrap")
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
  const titreHtml = titreLines.map((line) => escapeHtml(line)).join("<br />")
  textTitle.innerHTML = `<span class="text-overlay__title-inner">${titreHtml}</span>`
  textOverlay.classList.toggle("text-overlay--stacked-title", titreLines.length > 1)
  textOverlay.classList.toggle("text-overlay--title-rule", !!block.titleUnderline)
  textOverlay.classList.toggle("text-overlay--intro-poster", !!block.introPoster)

  const st = typeof block.sousTitre === "string" ? block.sousTitre.trim() : ""
  textSubtitle.textContent = st
  textSubtitle.hidden = !st

  textBody.innerHTML = block.paragraphes.map((p) => `<p>${escapeHtml(p)}</p>`).join("")

  if (block.credit) {
    textCredit.textContent = block.credit
    textCredit.hidden = false
  } else {
    textCredit.textContent = ""
    textCredit.hidden = true
  }

  if (!motionRef.reduced) {
    textOverlay.classList.remove("is-visible")
    requestAnimationFrame(() => {
      void textOverlay.offsetWidth
      textOverlay.classList.add("is-visible")
    })
  } else {
    textOverlay.classList.add("is-visible")
  }
}

function applyTextIfChanged(textKey) {
  if (textKey === lastTextKey) return
  lastTextKey = textKey
  fillTextContent(textKey)
}

function applySlideForIndex(index, meta = {}) {
  const kf = KEYFRAMES[index]
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

  progressBar.style.width = `${((sectionIndex + 1) / SECTION_COUNT) * 100}%`

  dots.forEach((d, i) => {
    d.classList.toggle("is-active", i === sectionIndex)
    d.setAttribute("aria-current", i === sectionIndex ? "true" : "false")
  })

  sectionLabelEl.textContent = SECTION_LABELS[sectionIndex] ?? ""
  if (stepIndicatorEl) {
    stepIndicatorEl.textContent = `Étape ${sectionIndex + 1} / ${SECTION_COUNT}`
  }
  scrollHint.classList.toggle("is-hidden", sectionIndex !== 0)
}

const k0 = KEYFRAMES[0]
fillTextContent(k0.textSection)
lastTextKey = k0.textSection
updateUi(0)
applySlideForIndex(0, {})

scrollApi = initScroll({
  reducedMotion: motionRef.reduced,
  onTransitionStart: (idx, kf, meta = {}) => {
    applySlideForIndex(idx, meta)
    applyTextIfChanged(kf.textSection)
  },
  onTransitionComplete: () => {},
  onProgressUi: (idx) => {
    updateUi(idx)
  }
})

dots.forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number.parseInt(btn.dataset.section, 10)
    scrollToSection(idx, motionRef.reduced, scrollApi)
  })
})

window.addEventListener("load", () => {
  scrollApi?.refresh()
})

window.addEventListener("keydown", (e) => {
  if (e.defaultPrevented) return
  const t = e.target
  if (t && (t.isContentEditable || (t.closest && t.closest("input, textarea, select")))) return
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
