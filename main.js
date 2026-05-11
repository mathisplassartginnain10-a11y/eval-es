import { createSlideStage } from "./src/slideStage.js"
import { initScroll, scrollToSection, SECTION_COUNT } from "./src/scroll.js"
import { KEYFRAMES, keyframeToSlideMedia } from "./src/sections.js"
import { CONTENT, SECTION_LABELS } from "./src/content.js"

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  motionRef.reduced = e.matches
})

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
const scrollRoot = document.getElementById("scroll-root")
const stageVideo = document.querySelector("#stage-video")
const stageImage = document.querySelector("#stage-image")

if (!stageVideo || !stageImage) {
  throw new Error("Éléments #stage-video et #stage-image requis (index.html).")
}

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
  textTitle.innerHTML = titreLines.map((line) => escapeHtml(line)).join("<br />")

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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function applyTextIfChanged(textKey) {
  if (textKey === lastTextKey) return
  lastTextKey = textKey
  fillTextContent(textKey)
}

function applySlideForIndex(index) {
  const kf = KEYFRAMES[index]
  slideStage.apply(keyframeToSlideMedia(kf))
}

function updateUi(sectionIndex) {
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
textOverlay.classList.add("is-visible")
updateUi(0)
applySlideForIndex(0)

scrollApi = initScroll({
  reducedMotion: motionRef.reduced,
  onTransitionStart: (idx, kf) => {
    applySlideForIndex(idx)
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
