/**
 * Canvas plein écran : étoiles avec dérive + scintillement.
 * Mode « hyperspace » : les mêmes étoiles accélèrent vers la caméra (~1 s).
 */

import gsap from "gsap"

const STAR_COUNT = 250
const FRAME_MS = 1000 / 30

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {CanvasRenderingContext2D | null} */
let ctx = null
/** @type {HTMLElement | null} */
let starfieldRoot = null
/** @type {HTMLElement | null} */
let flashEl = null
/** @type {number | null} */
let rafId = null
let active = false
let reduced = false
let frame = 0
let lastFrame = 0

/** Vitesse horizontale (px / frame ~30 fps) */
const DRIFT_X = -0.32
const DRIFT_Y = 0

/** @typedef {{
 *   x: number,
 *   y: number,
 *   r: number,
 *   twinkleSpeed: number,
 *   twinkleOffset: number,
 *   baseAlpha: number,
 *   warpX?: number,
 *   warpY?: number,
 *   z?: number,
 *   passed?: boolean,
 * }} Star */
/** @type {Star[]} */
let stars = []

let warpActive = false
/** 0 → 1 : intensité du warp (piloté par GSAP) */
let warpSpeed = 0
/** @type {gsap.core.Timeline | null} */
let warpTimeline = null

function resize() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function initStars() {
  if (!canvas || !ctx) return
  const w = canvas.width
  const h = canvas.height
  if (w < 1 || h < 1) return
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.2 + 0.2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinkleOffset: Math.random() * Math.PI * 2,
    baseAlpha: Math.random() * 0.5 + 0.3,
  }))
}

/** Convertit les étoiles visibles en coordonnées 3D sans en créer de nouvelles. */
function beginHyperspaceFromCurrentStars(w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.72

  for (const s of stars) {
    s.passed = false
    s.z = 0.55 + (1.3 - s.r) * 0.85 + (1 - s.baseAlpha) * 0.25
    s.warpX = ((s.x - cx) / focal) * s.z
    s.warpY = ((s.y - cy) / focal) * s.z
  }
}

function stopLoop() {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function drawNormal(w, h) {
  if (!ctx) return
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, w, h)

  const drift = !reduced
  for (const s of stars) {
    if (drift) {
      s.x += DRIFT_X
      s.y += DRIFT_Y
      if (s.x < -4) s.x = w + 4
    }
    const twinkle = reduced
      ? 0.88
      : 0.7 + 0.3 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset)
    const alpha = s.baseAlpha * twinkle
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
  }
}

function drawHyperspace(w, h) {
  if (!ctx) return

  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.72
  const trail = 0.02 + warpSpeed * 0.78

  ctx.fillStyle = `rgba(0, 0, 0, ${trail})`
  ctx.fillRect(0, 0, w, h)

  const baseStep = 0.008 + warpSpeed * warpSpeed * 0.42
  const streakScale = 16 + warpSpeed * 145
  const warpBlend = Math.min(1, warpSpeed / 0.18)

  for (const s of stars) {
    if (s.passed || s.z == null || s.warpX == null || s.warpY == null) continue

    s.z -= baseStep * (0.35 + s.z * 0.65)
    if (s.z <= 0.04) {
      s.passed = true
      continue
    }

    const sx = cx + (s.warpX / s.z) * focal
    const sy = cy + (s.warpY / s.z) * focal
    if (sx < -120 || sx > w + 120 || sy < -120 || sy > h + 120) continue

    const depth = 1 - Math.min(1, s.z / 1.6)
    const twinkle = 0.75 + 0.25 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset)
    const alpha = Math.min(1, s.baseAlpha * twinkle * (0.55 + depth * 0.35 + warpSpeed * 0.4))
    const dx = sx - cx
    const dy = sy - cy
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const streak = streakScale * (0.2 + depth) * Math.max(0.06, warpBlend)

    const hue = 198 + depth * 40
    const headR = s.r * (0.85 + depth * 0.9 + warpSpeed * 0.8)

    if (warpBlend < 0.55) {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, headR, 0, Math.PI * 2)
      ctx.fill()
    }

    if (warpBlend > 0.08) {
      ctx.strokeStyle = `hsla(${hue}, 85%, ${72 + depth * 22}%, ${alpha * warpBlend})`
      ctx.lineWidth = 0.4 + depth * 1.6 + warpSpeed * 1.6
      ctx.beginPath()
      ctx.moveTo(sx - ux * streak, sy - uy * streak)
      ctx.lineTo(sx, sy)
      ctx.stroke()
    }

    if (warpBlend >= 0.55) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.12)})`
      ctx.beginPath()
      ctx.arc(sx, sy, headR, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (warpSpeed > 0.35) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, focal * (0.35 + warpSpeed * 0.5))
    g.addColorStop(0, `rgba(255, 255, 255, ${warpSpeed * 0.07})`)
    g.addColorStop(0.35, `rgba(122, 184, 255, ${warpSpeed * 0.04})`)
    g.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

function draw(ts) {
  rafId = null
  if (!active || !canvas || !ctx) return
  rafId = requestAnimationFrame(draw)

  if (ts - lastFrame < FRAME_MS) return
  lastFrame = ts
  frame++

  const w = canvas.width
  const h = canvas.height

  if (warpActive) drawHyperspace(w, h)
  else drawNormal(w, h)
}

function startLoop() {
  stopLoop()
  rafId = requestAnimationFrame(draw)
}

function ensureFlashEl() {
  if (flashEl instanceof HTMLElement) return flashEl
  if (!(starfieldRoot instanceof HTMLElement)) return null
  flashEl = document.createElement("div")
  flashEl.className = "hyperspace-flash"
  flashEl.setAttribute("aria-hidden", "true")
  starfieldRoot.appendChild(flashEl)
  return flashEl
}

function flashHyperspaceCut() {
  const el = ensureFlashEl()
  if (!(el instanceof HTMLElement)) return
  gsap.killTweensOf(el)
  gsap.set(el, { opacity: 0 })
  gsap.to(el, { opacity: 1, duration: 0.045, ease: "power2.in" })
  gsap.to(el, { opacity: 0, duration: 0.22, ease: "power2.out", delay: 0.05 })
}

function stopHyperspaceWarp() {
  if (warpTimeline) {
    warpTimeline.kill()
    warpTimeline = null
  }
  warpActive = false
  warpSpeed = 0
  starfieldRoot?.classList.remove("is-hyperspace")
}

/**
 * Warp speed ~1 s puis cut (callback `onCut`).
 * @param {{ durationSec?: number, onCut?: () => void, onComplete?: () => void }} opts
 * @returns {Promise<void>}
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1, onCut, onComplete } = opts

  return new Promise((resolve) => {
    stopHyperspaceWarp()

    const finish = () => {
      stopHyperspaceWarp()
      initStars()
      onComplete?.()
      resolve()
    }

    if (reduced || !active || !canvas || !ctx) {
      onCut?.()
      finish()
      return
    }

    const w = canvas.width
    const h = canvas.height
    if (!stars.length) initStars()
    beginHyperspaceFromCurrentStars(w, h)

    warpActive = true
    warpSpeed = 0
    starfieldRoot?.classList.add("is-hyperspace")
    startLoop()

    const state = { t: 0 }
    warpTimeline = gsap.timeline({
      onComplete: finish,
    })

    warpTimeline.to(state, {
      t: 1,
      duration: durationSec * 0.92,
      ease: "power4.in",
      onUpdate: () => {
        warpSpeed = state.t
      },
    })

    warpTimeline.add(() => {
      flashHyperspaceCut()
      onCut?.()
    }, durationSec * 0.88)
  })
}

/** @param {{ reducedMotion?: boolean }} [opts] */
export function initStarsBackground(opts = {}) {
  reduced = !!opts.reducedMotion
  starfieldRoot = document.getElementById("starfield-bg")
  canvas =
    document.querySelector("#starfield-bg #stars-bg") ?? document.getElementById("stars-bg")
  if (!(canvas instanceof HTMLCanvasElement)) return
  ctx = canvas.getContext("2d")
  if (!ctx) return

  ensureFlashEl()

  const onResize = () => {
    resize()
    if (active && !warpActive) initStars()
  }
  window.addEventListener("resize", onResize, { passive: true })
  resize()
}

export function setStarsBackgroundReducedMotion(isReduced) {
  reduced = !!isReduced
}

/** Actif hors phase `intro-stars-phase` (piloté par main.js / updateUi). */
export function setStarsBackgroundActive(on) {
  active = !!on
  if (!canvas || !ctx) return
  canvas.hidden = !active
  if (active) {
    resize()
    if (!warpActive) initStars()
    lastFrame = 0
    startLoop()
  } else {
    stopHyperspaceWarp()
    stopLoop()
  }
}
