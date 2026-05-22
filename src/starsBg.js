/**
 * Fond étoiles : répartition uniforme, dérive lente, accélération visible pendant les transitions.
 */

import gsap from "gsap"

const STAR_COUNT = 280
const STAR_FPS = 30
const STAR_MS = 1000 / STAR_FPS

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
let starFrame = 0
let starLast = 0
let blackoutAlpha = 0
/** Multiplicateur de vitesse pendant transition (1 = normal). */
let speedMultiplier = 1

/** @typedef {{ x: number, y: number, r: number, vx: number, vy: number, tw: number, sp: number, baseAlpha: number }} Star */
/** @type {Star[]} */
let stars = []

function resizeStars() {
  if (!canvas) return
  const w = window.innerWidth
  const h = window.innerHeight
  const prevW = canvas.width
  const prevH = canvas.height
  canvas.width = w
  canvas.height = h
  if (w < 1 || h < 1) return
  if (!stars.length || prevW !== w || prevH !== h) {
    initStars()
  }
}

function initStars() {
  if (!canvas) return
  const W = canvas.width
  const H = canvas.height
  if (W < 1 || H < 1) return

  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.1 + 0.2,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08,
    tw: Math.random() * Math.PI * 2,
    sp: Math.random() * 0.008 + 0.002,
    baseAlpha: Math.random() * 0.5 + 0.2,
  }))
}

function paintBlackout() {
  if (!ctx || !canvas) return
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

/** @param {number} intensity 0–1 */
export function setWarpIntensity(intensity) {
  speedMultiplier = 1 + Math.max(0, Math.min(1, intensity)) * 7.5
}

function drawStars(ts) {
  rafId = requestAnimationFrame(drawStars)
  if (!active || !canvas || !ctx) return

  if (ts - starLast < STAR_MS) return
  starLast = ts
  starFrame++

  const W = canvas.width
  const H = canvas.height
  const mult = speedMultiplier
  const warpOn = mult > 1.15

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, W, H)

  for (const s of stars) {
    const px = s.x
    const py = s.y
    s.x += s.vx * mult
    s.y += s.vy * mult

    if (s.x < 0) s.x = W
    if (s.x > W) s.x = 0
    if (s.y < 0) s.y = H
    if (s.y > H) s.y = 0

    const tw = 0.75 + 0.25 * Math.sin(s.tw + starFrame * s.sp)
    let alpha = s.baseAlpha * tw
    let radius = s.r

    if (warpOn) {
      alpha = Math.min(1, alpha * (1 + (mult - 1) * 0.12))
      radius *= 1 + (mult - 1) * 0.08
      const streakLen = Math.hypot(s.x - px, s.y - py)
      if (streakLen > 0.6) {
        const g = ctx.createLinearGradient(px, py, s.x, s.y)
        g.addColorStop(0, `rgba(255,255,255,0)`)
        g.addColorStop(0.35, `rgba(200,220,255,${alpha * 0.35})`)
        g.addColorStop(1, `rgba(255,255,255,${alpha})`)
        ctx.strokeStyle = g
        ctx.lineWidth = radius * 1.6
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(s.x, s.y)
        ctx.stroke()
      }
    }

    ctx.beginPath()
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
  }

  if (warpOn) {
    const cx = W * 0.5
    const cy = H * 0.5
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.55)
    const glow = Math.min(0.14, (mult - 1) * 0.028)
    g.addColorStop(0, `rgba(255,255,255,${glow})`)
    g.addColorStop(0.45, `rgba(140,190,255,${glow * 0.5})`)
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  if (blackoutAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, blackoutAlpha)})`
    ctx.fillRect(0, 0, W, H)
  }
}

function startLoop() {
  if (rafId == null) {
    starLast = 0
    rafId = requestAnimationFrame(drawStars)
  }
}

function stopLoop() {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

/**
 * Transition de page : accélération visible des étoiles (sans perspective / warp radial).
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1.2, onCut, onComplete } = opts

  return new Promise((resolve) => {
    const finish = () => {
      setWarpIntensity(0)
      starfieldRoot?.classList.remove("is-hyperspace")
      onComplete?.()
      resolve()
    }

    if (reduced || !active || !canvas || !ctx) {
      onCut?.()
      finish()
      return
    }

    starfieldRoot?.classList.add("is-hyperspace")
    let cutFired = false
    const state = { p: 0 }

    gsap.to(state, {
      p: 1,
      duration: durationSec,
      ease: "power2.inOut",
      onUpdate: () => {
        setWarpIntensity(state.p)
        if (!cutFired && state.p >= 0.42) {
          cutFired = true
          onCut?.()
        }
      },
      onComplete: () => {
        if (!cutFired) {
          cutFired = true
          onCut?.()
        }
        finish()
      },
    })
  })
}

export function runPresentationFinale(opts = {}) {
  const { durationSec = 1.65, onComplete } = opts

  return new Promise((resolve) => {
    const finish = () => {
      setWarpIntensity(0)
      blackoutAlpha = 1
      paintBlackout()
      stopLoop()
      onComplete?.()
      resolve()
    }

    if (reduced || !active || !canvas || !ctx) {
      finish()
      return
    }

    blackoutAlpha = 0
    setWarpIntensity(0.85)
    starfieldRoot?.classList.add("is-hyperspace")

    const state = { b: 0, w: 0.85 }
    gsap.to(state, {
      w: 1.2,
      b: 1,
      duration: durationSec,
      ease: "power2.in",
      onUpdate: () => {
        setWarpIntensity(state.w)
        blackoutAlpha = state.b
      },
      onComplete: () => {
        starfieldRoot?.classList.remove("is-hyperspace")
        finish()
      },
    })
  })
}

export function initStarsBackground(opts = {}) {
  reduced = !!opts.reducedMotion
  starfieldRoot = document.getElementById("starfield-bg")
  canvas =
    document.querySelector("#starfield-bg #stars-bg") ?? document.getElementById("stars-bg")
  if (!(canvas instanceof HTMLCanvasElement)) return
  ctx = canvas.getContext("2d")
  if (!ctx) return

  window.addEventListener("resize", resizeStars, { passive: true })
  resizeStars()
}

export function setStarsBackgroundReducedMotion(isReduced) {
  reduced = !!isReduced
}

export function setStarsBackgroundActive(on) {
  active = !!on
  if (!canvas || !ctx) return
  canvas.hidden = !active
  if (active) {
    resizeStars()
    if (!stars.length) initStars()
    starLast = 0
    startLoop()
  } else {
    setWarpIntensity(0)
    stopLoop()
  }
}

export function restartStarsAfterFinale() {
  blackoutAlpha = 0
  setWarpIntensity(0)
  if (!canvas || !ctx) return
  active = true
  canvas.hidden = false
  resizeStars()
  initStars()
  starLast = 0
  startLoop()
}
