/**
 * Canvas plein écran : étoiles avec dérive + scintillement.
 * Mode hyperspace : mouvement radial réaliste (vitesse → longueur des traînées).
 */

import gsap from "gsap"

const STAR_COUNT = 280
const FRAME_MS = 1000 / 30

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {CanvasRenderingContext2D | null} */
let ctx = null
/** @type {HTMLElement | null} */
let starfieldRoot = null
/** @type {number | null} */
let rafId = null
let active = false
let reduced = false
let frame = 0
let lastFrame = 0

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
 *   prevSx?: number,
 *   prevSy?: number,
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

function beginHyperspaceFromCurrentStars(w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  for (const s of stars) {
    s.passed = false
    s.prevSx = undefined
    s.prevSy = undefined
    s.z = 0.85 + Math.random() * 1.35 + (1.3 - s.r) * 0.4
    s.warpX = ((s.x - cx) / focal) * s.z
    s.warpY = ((s.y - cy) / focal) * s.z
  }
}

function projectStar(s, cx, cy, focal) {
  if (s.z == null || s.warpX == null || s.warpY == null) return null
  const z = Math.max(0.02, s.z)
  return {
    sx: cx + (s.warpX / z) * focal,
    sy: cy + (s.warpY / z) * focal,
    depth: 1 - Math.min(1, z / 2.2),
  }
}

function drawMotionStreak(ctx, x0, y0, x1, y1, alpha, depth, warp) {
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  if (dist < 0.35) return

  const ux = dx / dist
  const uy = dy / dist
  const w = 0.35 + depth * 1.4 + warp * 2.2
  const hue = 205 + depth * 35
  const lit = 78 + depth * 18

  const segments = Math.min(6, Math.max(3, Math.ceil(dist / 18)))
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const segA = alpha * (0.25 + t1 * 0.75) * warp
    ctx.strokeStyle = `hsla(${hue}, 72%, ${lit}%, ${segA})`
    ctx.lineWidth = w * (0.5 + t1 * 0.5)
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(x0 + dx * t0, y0 + dy * t0)
    ctx.lineTo(x0 + dx * t1, y0 + dy * t1)
    ctx.stroke()
  }

  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * (0.85 + warp * 0.15))})`
  ctx.beginPath()
  ctx.arc(x1, y1, 0.35 + depth * 0.9 + warp * 0.5, 0, Math.PI * 2)
  ctx.fill()
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
  const focal = Math.min(w, h) * 0.68

  const vel = warpSpeed * warpSpeed
  const trailFade = 0.06 + vel * 0.82
  ctx.fillStyle = `rgba(0, 0, 0, ${trailFade})`
  ctx.fillRect(0, 0, w, h)

  const zStep = (0.004 + vel * 0.055) * (warpSpeed > 0.08 ? 1 : 0.35)

  for (const s of stars) {
    if (s.passed || s.z == null || s.warpX == null || s.warpY == null) continue

    s.z -= zStep * (0.25 + s.z * 0.75)
    if (s.z <= 0.025) {
      s.passed = true
      continue
    }

    const proj = projectStar(s, cx, cy, focal)
    if (!proj) continue
    const { sx, sy, depth } = proj
    if (sx < -160 || sx > w + 160 || sy < -160 || sy > h + 160) continue

    const twinkle = 0.8 + 0.2 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset)
    const alpha = Math.min(1, s.baseAlpha * twinkle * (0.45 + depth * 0.4 + vel * 0.35))

    const hasPrev = s.prevSx != null && s.prevSy != null
    const motion = hasPrev ? Math.hypot(sx - s.prevSx, sy - s.prevSy) : 0

    if (hasPrev && motion > 1.2 && warpSpeed > 0.06) {
      drawMotionStreak(ctx, s.prevSx, s.prevSy, sx, sy, alpha, depth, warpSpeed)
    } else {
      const headR = s.r * (0.7 + depth * 0.5 + vel * 0.4)
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, headR, 0, Math.PI * 2)
      ctx.fill()
    }

    s.prevSx = sx
    s.prevSy = sy
  }

  if (vel > 0.12) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, focal * (0.2 + vel * 0.45))
    g.addColorStop(0, `rgba(255, 255, 255, ${vel * 0.04})`)
    g.addColorStop(0.4, `rgba(140, 190, 255, ${vel * 0.025})`)
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
 * Accélération → traînées réalistes → ralentissement → callback `onCut`.
 * @param {{ durationSec?: number, onCut?: () => void, onComplete?: () => void }} opts
 * @returns {Promise<void>}
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1.2, onCut, onComplete } = opts

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

    const accelDur = durationSec * 0.5
    const decelDur = durationSec * 0.5
    const state = { t: 0 }

    warpTimeline = gsap.timeline({ onComplete: finish })

    warpTimeline.to(state, {
      t: 1,
      duration: accelDur,
      ease: "power2.in",
      onUpdate: () => {
        warpSpeed = state.t
      },
    })

    warpTimeline.to(state, {
      t: 0,
      duration: decelDur,
      ease: "power2.out",
      onUpdate: () => {
        warpSpeed = state.t
      },
    })

    warpTimeline.add(() => {
      warpSpeed = 0
      onCut?.()
    })
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
