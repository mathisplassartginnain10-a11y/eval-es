/**
 * Canvas plein écran : étoiles avec dérive douce + scintillement (étape 1 uniquement, piloté par main.js).
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

/** @typedef {{ x: number, y: number, r: number, vx: number, vy: number, twinkleSpeed: number, twinkleOffset: number, baseAlpha: number }} Star */
/** @type {Star[]} */
let stars = []

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
    vx: (Math.random() - 0.5) * 0.1,
    vy: (Math.random() - 0.5) * 0.1,
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
      s.x += s.vx
      s.y += s.vy
      if (s.x < -2) s.x = w + 2
      if (s.x > w + 2) s.x = -2
      if (s.y < -2) s.y = h + 2
      if (s.y > h + 2) s.y = -2
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
  canvas = document.getElementById("stars-bg")
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

/** Actif uniquement sur la page 1 (`sectionIndex === 0` → `data-step="1"`). */
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
