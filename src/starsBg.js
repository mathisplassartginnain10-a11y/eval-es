/**
 * Fond étoiles : dérive uniforme au repos, warp radial (étoiles vers l’observateur) en transition.
 */

import gsap from "gsap"
import { smoothstep } from "./motionDesign.js"

const STAR_COUNT = 280
const CONCLUSION_STAR_COUNT = 460
/** Dérive lente permanente (alignée sur conclusion-animation.html : z += 0.003). */
const CONCLUSION_BASE_DRIFT = 0.004
const CONCLUSION_WARP_ACCEL_SEC = 0.7
const CONCLUSION_WARP_DECEL_SEC = 0.7
const CONCLUSION_WARP_PEAK = 0.15
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
let frame = 0
let lastFrame = 0
let blackoutAlpha = 0

let warpActive = false
let warpSpeed = 0
/** @type {gsap.core.Timeline | null} */
let warpTimeline = null

let conclusionMode = false
let conclusionWarpSpd = 0
/** @type {gsap.core.Timeline | null} */
let conclusionWarpTimeline = null

/** @typedef {{
 *   x: number,
 *   y: number,
 *   r: number,
 *   vx: number,
 *   vy: number,
 *   tw: number,
 *   sp: number,
 *   baseAlpha: number,
 *   depth?: number,
 *   warpX?: number,
 *   warpY?: number,
 *   z?: number,
 *   prevSx?: number,
 *   prevSy?: number,
 * }} Star */
/** @type {Star[]} */
let stars = []

/** Mesure la taille réelle du conteneur du fond étoilé (fallback : viewport). */
function measureStarfield() {
  let w = 0
  let h = 0
  if (starfieldRoot instanceof HTMLElement) {
    const rect = starfieldRoot.getBoundingClientRect()
    w = Math.round(rect.width)
    h = Math.round(rect.height)
  }
  if (w < 2 || h < 2) {
    w = window.innerWidth || document.documentElement.clientWidth || 0
    h = window.innerHeight || document.documentElement.clientHeight || 0
  }
  return { w, h }
}

function resizeStars() {
  if (!canvas) return
  const { w, h } = measureStarfield()
  if (w < 1 || h < 1) return

  const prevW = canvas.width
  const prevH = canvas.height
  canvas.width = w
  canvas.height = h
  canvas.style.width = w + "px"
  canvas.style.height = h + "px"

  if (!stars.length || prevW !== w || prevH !== h) {
    if (conclusionMode) initConclusionStars()
    else initStars()
  }
}

/** Force la resynchro du canvas avec son conteneur (avant warp). */
function ensureCanvasInSync() {
  if (!canvas) return
  const { w, h } = measureStarfield()
  if (w < 1 || h < 1) return
  if (canvas.width !== w || canvas.height !== h) {
    resizeStars()
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
    depth: Math.random(),
  }))
}

/** Étoiles conclusion : coords normalisées + profondeur z (même logique que l’iframe). */
function initConclusionStars() {
  if (!canvas) return
  const W = canvas.width
  const H = canvas.height
  if (W < 1 || H < 1) return

  stars = Array.from({ length: CONCLUSION_STAR_COUNT }, () => ({
    nx: (Math.random() - 0.5) * 2,
    ny: (Math.random() - 0.5) * 2,
    cz: Math.random(),
    r: Math.random() * 0.9 + 0.2,
    a: Math.random() * 0.5 + 0.3,
    tw: Math.random() * Math.PI * 2,
    sp: Math.random() * 0.008 + 0.002,
  }))
}

function drawConclusionStars(w, h, spd) {
  if (!ctx) return

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, w, h)

  const cx = w * 0.5
  const cy = h * 0.5
  const drift = CONCLUSION_BASE_DRIFT + spd

  for (const s of stars) {
    s.cz = (s.cz ?? 0) + drift
    if (s.cz > 1) s.cz -= 1

    const p = 1 / (1.2 - s.cz * 0.8)
    const sx = cx + (s.nx ?? 0) * w * 0.55 * p
    const sy = cy + (s.ny ?? 0) * h * 0.55 * p
    const sr = (s.r ?? 0.5) * p * 0.75

    if (spd > 0.03) {
      const pPrev = 1 / (1.2 - (s.cz - 0.025) * 0.8)
      const px = cx + (s.nx ?? 0) * w * 0.55 * pPrev
      const py = cy + (s.ny ?? 0) * h * 0.55 * pPrev
      const dx = sx - px
      const dy = sy - py
      const len = Math.hypot(dx, dy) || 1
      const tl = spd * 200 * p
      const ux = dx / len
      const uy = dy / len
      const grad = ctx.createLinearGradient(sx - ux * tl, sy - uy * tl, sx, sy)
      grad.addColorStop(0, "rgba(255,255,255,0)")
      grad.addColorStop(1, `rgba(255,255,255,${Math.min(0.95, spd * 8)})`)
      ctx.strokeStyle = grad
      ctx.lineWidth = sr * 1.5
      ctx.beginPath()
      ctx.moveTo(sx - ux * tl, sy - uy * tl)
      ctx.lineTo(sx, sy)
      ctx.stroke()
    }

    const tw = spd > 0.05 ? 1 : 0.7 + 0.3 * Math.sin(s.tw + frame * s.sp)
    ctx.beginPath()
    ctx.arc(sx, sy, Math.max(0.2, sr), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, (s.a ?? 0.5) * tw)})`
    ctx.fill()
  }

  if (spd > 0.04) {
    const focal = Math.min(w, h) * 0.55
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, focal * (0.2 + spd * 2))
    glow.addColorStop(0, `rgba(255, 255, 255, ${spd * 0.06})`)
    glow.addColorStop(0.45, `rgba(140, 190, 255, ${spd * 0.035})`)
    glow.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }
}

function stopConclusionWarpPulse() {
  if (conclusionWarpTimeline) {
    conclusionWarpTimeline.kill()
    conclusionWarpTimeline = null
  }
  conclusionWarpSpd = 0
  if (conclusionMode) starfieldRoot?.classList.remove("is-hyperspace")
}

function paintBlackout() {
  if (!ctx || !canvas) return
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function beginHyperspaceFromCurrentStars(w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  for (const s of stars) {
    s.prevSx = undefined
    s.prevSy = undefined
    const depth = s.depth ?? 0.5
    s.z = 0.75 + depth * 1.35 + (1.25 - Math.min(1.25, s.r)) * 0.3
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

function recycleStarAtDepth(s, w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  let dx = s.prevSx != null ? s.prevSx - cx : (Math.random() - 0.5) * w * 0.2
  let dy = s.prevSy != null ? s.prevSy - cy : (Math.random() - 0.5) * h * 0.2
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len

  const dist = 0.06 + Math.random() * 0.14
  s.z = 1.75 + (s.depth ?? 0.5) * 0.45 + Math.random() * 0.35
  s.warpX = dx * dist * s.z
  s.warpY = dy * dist * s.z
  s.prevSx = undefined
  s.prevSy = undefined

  const proj = projectStar(s, cx, cy, focal)
  if (proj) {
    s.prevSx = proj.sx
    s.prevSy = proj.sy
  }
}

function shortestDx(x0, x1, w) {
  let dx = x1 - x0
  if (dx > w * 0.5) dx -= w
  if (dx < -w * 0.5) dx += w
  return dx
}

function isValidWarpStreak(dx, dy, dist, w, h, sx, sy, cx, cy, speed) {
  if (speed <= 0.05 || dist < 1.2 || dist > Math.min(w, h) * 0.22) return false
  if (Math.abs(dx) / (dist || 1) > 0.92 && Math.abs(dy) / (dist || 1) < 0.12) return false
  const rdx = sx - cx
  const rdy = sy - cy
  const rLen = Math.hypot(rdx, rdy)
  if (rLen < 8) return false
  return (dx * rdx + dy * rdy) / (dist * rLen) > 0.2
}

function drawMotionStreak(ctx, x0, y0, x1, y1, alpha, depth, warp) {
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  if (dist < 0.35) return

  const len = Math.min(dist, 96 + warp * 48)
  const ux = dx / dist
  const uy = dy / dist
  const tailX = x1 - ux * len
  const tailY = y1 - uy * len
  const thick = 0.45 + depth * 1.1 + warp * 1.8
  const hue = 205 + depth * 35
  const lit = 78 + depth * 18

  const grad = ctx.createLinearGradient(tailX, tailY, x1, y1)
  grad.addColorStop(0, `hsla(${hue}, 55%, ${lit}%, 0)`)
  grad.addColorStop(0.45, `hsla(${hue}, 68%, ${lit}%, ${alpha * warp * 0.35})`)
  grad.addColorStop(1, `hsla(${hue}, 72%, ${lit + 8}%, ${Math.min(1, alpha * (0.7 + warp * 0.25))})`)

  ctx.save()
  ctx.translate(x1, y1)
  ctx.rotate(Math.atan2(dy, dx))
  ctx.fillStyle = grad
  ctx.fillRect(-len, -thick * 0.5, len, thick)
  ctx.restore()

  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * (0.85 + warp * 0.15))})`
  ctx.beginPath()
  ctx.arc(x1, y1, 0.35 + depth * 0.9 + warp * 0.5, 0, Math.PI * 2)
  ctx.fill()
}

function commitStarsFromWarp(w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  for (const s of stars) {
    let x = s.x
    let y = s.y

    if (s.prevSx != null && s.prevSy != null) {
      x = s.prevSx
      y = s.prevSy
    } else if (s.warpX != null && s.warpY != null && s.z != null) {
      const proj = projectStar(s, cx, cy, focal)
      if (proj) {
        x = proj.sx
        y = proj.sy
      }
    }

    if (x < 0) x += w
    if (x > w) x -= w
    if (y < 0) y = 0
    if (y > h) y = h

    s.x = x
    s.y = y
    delete s.warpX
    delete s.warpY
    delete s.z
    delete s.prevSx
    delete s.prevSy
  }
}

function drawNormal(w, h) {
  if (!ctx) return
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, w, h)

  for (const s of stars) {
    s.x += s.vx
    s.y += s.vy

    if (s.x < 0) s.x = w
    if (s.x > w) s.x = 0
    if (s.y < 0) s.y = h
    if (s.y > h) s.y = 0

    const tw = 0.75 + 0.25 * Math.sin(s.tw + frame * s.sp)
    const alpha = s.baseAlpha * tw

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

  const speed = Math.max(warpSpeed, 0.06)
  const vel = speed * speed
  ctx.fillStyle = `rgba(0, 0, 0, ${0.032 + vel * 0.76})`
  ctx.fillRect(0, 0, w, h)

  const zStep = (0.0045 + vel * 0.058) * (speed > 0.1 ? 1 : 0.55)

  for (const s of stars) {
    if (s.z == null || s.warpX == null || s.warpY == null) continue

    s.z -= zStep * (0.22 + s.z * 0.78)
    if (s.z <= 0.03) {
      recycleStarAtDepth(s, w, h)
      continue
    }

    const proj = projectStar(s, cx, cy, focal)
    if (!proj) continue
    const { sx, sy, depth } = proj

    const twinkle = 0.8 + 0.2 * Math.sin(frame * s.sp + s.tw)
    const alpha = Math.min(1, s.baseAlpha * twinkle * (0.48 + depth * 0.38 + vel * 0.32))

    const hasPrev = s.prevSx != null && s.prevSy != null
    let streakDx = 0
    let streakDy = 0
    let streakDist = 0
    if (hasPrev) {
      streakDx = shortestDx(s.prevSx, sx, w)
      streakDy = sy - s.prevSy
      streakDist = Math.hypot(streakDx, streakDy)
    }

    if (
      hasPrev &&
      isValidWarpStreak(streakDx, streakDy, streakDist, w, h, sx, sy, cx, cy, speed)
    ) {
      drawMotionStreak(ctx, sx - streakDx, sy - streakDy, sx, sy, alpha, depth, speed)
    } else {
      const headR = s.r * (0.72 + depth * 0.48 + vel * 0.38)
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, headR, 0, Math.PI * 2)
      ctx.fill()
    }

    s.prevSx = sx
    s.prevSy = sy
  }

  if (vel > 0.08) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, focal * (0.18 + vel * 0.42))
    g.addColorStop(0, `rgba(255, 255, 255, ${vel * 0.038})`)
    g.addColorStop(0.4, `rgba(140, 190, 255, ${vel * 0.022})`)
    g.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  if (blackoutAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, blackoutAlpha)})`
    ctx.fillRect(0, 0, w, h)
  }
}

function draw(ts) {
  rafId = requestAnimationFrame(draw)
  if (!active || !canvas || !ctx) return

  if (ts - lastFrame < STAR_MS) return
  lastFrame = ts
  frame++

  const w = canvas.width
  const h = canvas.height

  if (conclusionMode) drawConclusionStars(w, h, conclusionWarpSpd)
  else if (warpActive) drawHyperspace(w, h)
  else drawNormal(w, h)
}

function startLoop() {
  if (rafId == null) {
    lastFrame = 0
    rafId = requestAnimationFrame(draw)
  }
}

function stopLoop() {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function stopHyperspaceWarp() {
  if (warpTimeline) {
    warpTimeline.kill()
    warpTimeline = null
  }
  warpActive = false
  warpSpeed = 0
  if (!conclusionMode || !conclusionWarpTimeline) {
    starfieldRoot?.classList.remove("is-hyperspace")
  }
}

/**
 * Warp radial : les étoiles foncent vers l’observateur (transition de page).
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1.2, onCut, onComplete } = opts

  return new Promise((resolve) => {
    stopHyperspaceWarp()
    if (conclusionMode) setConclusionStarfieldEnabled(false)
    ensureCanvasInSync()

    const finish = () => {
      const ww = canvas?.width ?? 0
      const hh = canvas?.height ?? 0
      if (ww > 0 && hh > 0 && stars.length) commitStarsFromWarp(ww, hh)
      stopHyperspaceWarp()
      startLoop()
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

    const accelDur = durationSec * 0.42
    const decelDur = durationSec * 0.58
    const settleDur = 0.18
    const state = { t: 0 }
    let cutFired = false

    warpTimeline = gsap.timeline({ onComplete: finish })

    warpTimeline.to(state, {
      t: 1,
      duration: accelDur,
      ease: "power3.in",
      onUpdate: () => {
        warpSpeed = smoothstep(state.t)
      },
    })

    warpTimeline.to(state, {
      t: 0,
      duration: decelDur,
      ease: "power2.inOut",
      onUpdate: () => {
        const t = Math.max(state.t, 0.06)
        warpSpeed = smoothstep(t)
        if (!cutFired && t <= 0.45) {
          cutFired = true
          onCut?.()
        }
      },
    })

    warpTimeline.to(
      {},
      {
        duration: settleDur,
        onUpdate: () => {
          warpSpeed = 0.07
        },
      }
    )

    warpTimeline.add(() => {
      warpSpeed = 0.05
      if (!cutFired) {
        cutFired = true
        onCut?.()
      }
    })
  })
}

/** Fin de présentation : étoiles qui fusent puis fondu au noir. */
export function runPresentationFinale(opts = {}) {
  const { durationSec = 1.85, onComplete } = opts

  return new Promise((resolve) => {
    stopHyperspaceWarp()
    if (conclusionMode) setConclusionStarfieldEnabled(false)
    ensureCanvasInSync()
    blackoutAlpha = 0

    const finish = () => {
      const ww = canvas?.width ?? 0
      const hh = canvas?.height ?? 0
      if (ww > 0 && hh > 0 && stars.length) commitStarsFromWarp(ww, hh)
      blackoutAlpha = 1
      paintBlackout()
      stopHyperspaceWarp()
      stopLoop()
      onComplete?.()
      resolve()
    }

    if (reduced || !active || !canvas || !ctx) {
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

    const warpDur = durationSec * 0.68
    const blackDur = durationSec * 0.42
    const state = { t: 0, b: 0 }

    warpTimeline = gsap.timeline({ onComplete: finish })

    warpTimeline.to(state, {
      t: 1,
      duration: warpDur,
      ease: "power3.in",
      onUpdate: () => {
        warpSpeed = smoothstep(state.t) * 1.2
      },
    })

    warpTimeline.to(
      state,
      {
        b: 1,
        duration: blackDur,
        ease: "power2.in",
        onUpdate: () => {
          blackoutAlpha = state.b
          warpSpeed = Math.max(0.35, 1 - state.b * 0.55)
        },
      },
      warpDur * 0.38
    )
  })
}

/** Mode conclusion : plus d’étoiles, dérive continue, rendu aligné sur l’iframe. */
export function setConclusionStarfieldEnabled(on) {
  const was = conclusionMode
  conclusionMode = !!on

  if (conclusionMode) {
    stopHyperspaceWarp()
    starfieldRoot?.classList.add("is-conclusion-stars")
    document.body.classList.add("conclusion-stars-active")
    if (canvas && ctx) {
      initConclusionStars()
      lastFrame = 0
      if (active) startLoop()
    }
    return
  }

  stopConclusionWarpPulse()
  starfieldRoot?.classList.remove("is-conclusion-stars")
  document.body.classList.remove("conclusion-stars-active")
  if (was && canvas && ctx) {
    initStars()
    lastFrame = 0
    if (active) startLoop()
  }
}

/** Pulse warp conclusion (700 ms accel + 700 ms decel, comme conclusion-animation.html). */
export function pulseConclusionWarp() {
  stopConclusionWarpPulse()
  if (reduced || !active || !conclusionMode || !ctx) return
  ensureCanvasInSync()

  starfieldRoot?.classList.add("is-hyperspace")
  const state = { spd: 0 }

  conclusionWarpTimeline = gsap.timeline({
    onComplete: () => {
      conclusionWarpSpd = 0
      starfieldRoot?.classList.remove("is-hyperspace")
      conclusionWarpTimeline = null
    },
  })

  conclusionWarpTimeline.to(state, {
    spd: CONCLUSION_WARP_PEAK,
    duration: CONCLUSION_WARP_ACCEL_SEC,
    ease: "power3.in",
    onUpdate: () => {
      conclusionWarpSpd = state.spd
    },
  })

  conclusionWarpTimeline.to(state, {
    spd: 0,
    duration: CONCLUSION_WARP_DECEL_SEC,
    ease: "power3.out",
    onUpdate: () => {
      conclusionWarpSpd = state.spd
    },
  })
}

/** @deprecated Conservé pour compatibilité — le warp radial gère l’intensité. */
export function setWarpIntensity(_intensity) {}

export function initStarsBackground(opts = {}) {
  reduced = !!opts.reducedMotion
  starfieldRoot = document.getElementById("starfield-bg")
  canvas =
    document.querySelector("#starfield-bg #stars-bg") ?? document.getElementById("stars-bg")
  if (!(canvas instanceof HTMLCanvasElement)) return
  ctx = canvas.getContext("2d")
  if (!ctx) return

  window.addEventListener("resize", resizeStars, { passive: true })
  window.addEventListener("orientationchange", resizeStars, { passive: true })

  if (typeof ResizeObserver !== "undefined" && starfieldRoot instanceof HTMLElement) {
    try {
      const ro = new ResizeObserver(() => resizeStars())
      ro.observe(starfieldRoot)
    } catch (_) {
      /* ResizeObserver indisponible : on garde les listeners window */
    }
  }

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
    lastFrame = 0
    startLoop()
  } else {
    stopHyperspaceWarp()
    stopConclusionWarpPulse()
    setConclusionStarfieldEnabled(false)
    stopLoop()
  }
}

export function restartStarsAfterFinale() {
  blackoutAlpha = 0
  stopHyperspaceWarp()
  setConclusionStarfieldEnabled(false)
  if (!canvas || !ctx) return
  active = true
  canvas.hidden = false
  resizeStars()
  initStars()
  lastFrame = 0
  startLoop()
}
