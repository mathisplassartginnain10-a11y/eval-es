/**
 * Fond étoiles plein écran : répartition uniforme, dérive lente omnidirectionnelle.
 * Pas de warp / perspective — rebouclage sur les quatre bords.
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

function drawStars(ts) {
  rafId = requestAnimationFrame(drawStars)
  if (!active || !canvas || !ctx) return

  if (ts - starLast < STAR_MS) return
  starLast = ts
  starFrame++

  const W = canvas.width
  const H = canvas.height

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, W, H)

  for (const s of stars) {
    s.x += s.vx
    s.y += s.vy

    if (s.x < 0) s.x = W
    if (s.x > W) s.x = 0
    if (s.y < 0) s.y = H
    if (s.y > H) s.y = 0

    const tw = 0.75 + 0.25 * Math.sin(s.tw + starFrame * s.sp)
    const alpha = s.baseAlpha * tw

    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
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
 * Transition de page : temporisation seule (plus d’effet warp).
 * @param {{ durationSec?: number, onCut?: () => void, onComplete?: () => void }} opts
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1.2, onCut, onComplete } = opts

  return new Promise((resolve) => {
    const finish = () => {
      onComplete?.()
      resolve()
    }

    if (reduced || !active) {
      onCut?.()
      finish()
      return
    }

    const cutAt = durationSec * 0.45
    gsap.delayedCall(cutAt, () => onCut?.())
    gsap.delayedCall(durationSec, finish)
  })
}

/**
 * Fin de présentation : fondu au noir sur le canvas (étoiles continuent de dériver).
 */
export function runPresentationFinale(opts = {}) {
  const { durationSec = 1.65, onComplete } = opts

  return new Promise((resolve) => {
    const finish = () => {
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
    const state = { b: 0 }
    gsap.to(state, {
      b: 1,
      duration: durationSec * 0.55,
      delay: durationSec * 0.35,
      ease: "power2.in",
      onUpdate: () => {
        blackoutAlpha = state.b
      },
      onComplete: finish,
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
    stopLoop()
  }
}

/** Réactive le ciel après la finale « Terminer la présentation ». */
export function restartStarsAfterFinale() {
  blackoutAlpha = 0
  if (!canvas || !ctx) return
  active = true
  canvas.hidden = false
  resizeStars()
  initStars()
  starLast = 0
  startLoop()
}
