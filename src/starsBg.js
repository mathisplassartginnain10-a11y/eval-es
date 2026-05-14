/**
 * Canvas plein écran : étoiles avec dérive + scintillement (toutes les étapes sauf intro plein écran parent).
 */

const STAR_COUNT = 250
const FRAME_MS = 1000 / 30

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {CanvasRenderingContext2D | null} */
let ctx = null
/** @type {number | null} */
let rafId = null
let active = false
let reduced = false
let frame = 0
let lastFrame = 0

/** Vitesse horizontale unique (px / frame throttlée ~30 fps) — droite → gauche sur tout l'écran */
const DRIFT_X = -0.32
const DRIFT_Y = 0

/** @typedef {{ x: number, y: number, r: number, twinkleSpeed: number, twinkleOffset: number, baseAlpha: number }} Star */
/** @type {Star[]} */
let stars = []

function resize() {
  if (!canvas) return
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W
  canvas.height = H
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

function stopLoop() {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
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

function startLoop() {
  stopLoop()
  rafId = requestAnimationFrame(draw)
}

/** @param {{ reducedMotion?: boolean }} [opts] */
export function initStarsBackground(opts = {}) {
  reduced = !!opts.reducedMotion
  canvas =
    document.querySelector("#starfield-bg #stars-bg") ?? document.getElementById("stars-bg")
  if (!(canvas instanceof HTMLCanvasElement)) return
  ctx = canvas.getContext("2d")
  if (!ctx) return

  const onResize = () => {
    resize()
    if (active) initStars()
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
    initStars()
    lastFrame = 0
    startLoop()
  } else {
    stopLoop()
  }
}
