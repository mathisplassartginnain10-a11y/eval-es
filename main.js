import * as THREE from "three"
import { createScene } from "./src/scene.js"
import { createStarField } from "./src/stars.js"
import { loadEarthModel, preloadForSections } from "./src/loader.js"
import { createPostProcessing } from "./src/postfx.js"
import { initScroll, scrollToSection, lerp, SECTION_COUNT } from "./src/scroll.js"
import { KEYFRAMES } from "./src/sections.js"
import { CONTENT, SECTION_LABELS } from "./src/content.js"

const motionRef = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  motionRef.reduced = e.matches
})

const canvas = document.getElementById("webgl")
const progressBar = document.getElementById("progress-bar")
const textOverlay = document.getElementById("text-overlay")
const textKicker = document.getElementById("text-kicker")
const textTitle = document.getElementById("text-title")
const textSubtitle = document.getElementById("text-subtitle")
const textBody = document.getElementById("text-body")
const textCredit = document.getElementById("text-credit")
const sectionLabelEl = document.getElementById("section-label")
const scrollHint = document.getElementById("scroll-hint")
const dots = [...document.querySelectorAll(".section-dot")]

const ctx = createScene(canvas)
const stars = createStarField(ctx.scene, THREE, motionRef)
const postFx = createPostProcessing(ctx.scene, ctx.camera, ctx.renderer)

let lastTextKey = null
let modelRequestId = 0
let lastModelUrl = null
let lastPreloadSection = -1
let liveSectionIndex = 0
/** @type {{ refresh: () => void, kill: () => void } | null} */
let scrollNav = null

function fillTextContent(key) {
  const block = CONTENT[key]
  if (!block) return

  textKicker.textContent = "Exposé — Enseignement scientifique"
  textTitle.textContent = block.titre
  textSubtitle.textContent = block.sousTitre
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

async function setEarthModel(url) {
  const req = ++modelRequestId
  const root = await loadEarthModel(THREE, url)
  if (req !== modelRequestId) return
  ctx.earthHolder.clear()
  ctx.earthHolder.add(root)
}

function updateUiFromScroll(progress, sectionIndex) {
  progressBar.style.width = `${progress * 100}%`

  dots.forEach((d, i) => {
    d.classList.toggle("is-active", i === sectionIndex)
    d.setAttribute("aria-current", i === sectionIndex ? "true" : "false")
  })

  sectionLabelEl.textContent = SECTION_LABELS[sectionIndex] ?? ""

  scrollHint.classList.toggle("is-hidden", sectionIndex !== 0)
}

function handleScrollState(s) {
  const { from, to, easedT, modelUrl, textKey, progress, sectionIndex } = s

  liveSectionIndex = sectionIndex

  const cx = lerp(from.camera.x, to.camera.x, easedT)
  const cy = lerp(from.camera.y, to.camera.y, easedT)
  const cz = lerp(from.camera.z, to.camera.z, easedT)
  const tx = lerp(from.target.x, to.target.x, easedT)
  const ty = lerp(from.target.y, to.target.y, easedT)
  const tz = lerp(from.target.z, to.target.z, easedT)

  ctx.camera.position.set(cx, cy, cz)
  ctx.camera.lookAt(tx, ty, tz)

  const mx = lerp(from.modelPos.x, to.modelPos.x, easedT)
  const my = lerp(from.modelPos.y, to.modelPos.y, easedT)
  const mz = lerp(from.modelPos.z, to.modelPos.z, easedT)
  const ms = lerp(from.modelScale, to.modelScale, easedT)

  ctx.earthHolder.position.set(mx, my, mz)
  ctx.earthHolder.scale.setScalar(ms)

  if (modelUrl !== lastModelUrl) {
    lastModelUrl = modelUrl
    void setEarthModel(modelUrl)
  }

  applyTextIfChanged(textKey)
  updateUiFromScroll(progress, sectionIndex)

  if (sectionIndex !== lastPreloadSection) {
    lastPreloadSection = sectionIndex
    const nextIdx = Math.min(sectionIndex + 1, SECTION_COUNT - 1)
    preloadForSections(THREE, KEYFRAMES, [sectionIndex, nextIdx])
  }
}

function onResize() {
  ctx.onResize()
  stars.updateOnResize()
  if (postFx) postFx.setSize(window.innerWidth, window.innerHeight)
  scrollNav?.refresh()
}

window.addEventListener("resize", onResize)

dots.forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number.parseInt(btn.dataset.section, 10)
    scrollToSection(idx, motionRef.reduced)
  })
})

scrollNav = initScroll({
  reducedMotion: motionRef.reduced,
  onScrollState: handleScrollState
})

window.addEventListener("load", () => {
  scrollNav?.refresh()
})

function goSection(delta) {
  const next = Math.max(0, Math.min(SECTION_COUNT - 1, liveSectionIndex + delta))
  scrollToSection(next, motionRef.reduced)
}

window.addEventListener("keydown", (e) => {
  if (e.defaultPrevented) return
  const t = e.target
  if (t && (t.isContentEditable || (t.closest && t.closest("input, textarea, select")))) return

  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault()
    goSection(1)
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault()
    goSection(-1)
  } else if (e.key === "Home") {
    e.preventDefault()
    scrollToSection(0, motionRef.reduced)
  } else if (e.key === "End") {
    e.preventDefault()
    scrollToSection(SECTION_COUNT - 1, motionRef.reduced)
  }
})

const k0 = KEYFRAMES[0]
ctx.camera.position.set(k0.camera.x, k0.camera.y, k0.camera.z)
ctx.camera.lookAt(k0.target.x, k0.target.y, k0.target.z)
ctx.earthHolder.position.set(k0.modelPos.x, k0.modelPos.y, k0.modelPos.z)
ctx.earthHolder.scale.setScalar(k0.modelScale)

fillTextContent(k0.textSection)
lastTextKey = k0.textSection
textOverlay.classList.add("is-visible")
updateUiFromScroll(0, 0)

lastModelUrl = k0.modelFile
preloadForSections(THREE, KEYFRAMES, [0, 1]).then(() => setEarthModel(k0.modelFile))

function animate() {
  requestAnimationFrame(animate)
  if (!motionRef.reduced) ctx.earthHolder.rotation.y += 0.0015
  stars.update()
  if (postFx) postFx.render()
  else ctx.renderer.render(ctx.scene, ctx.camera)
}

animate()
