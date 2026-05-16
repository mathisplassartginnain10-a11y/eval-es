/**
 * Canvas plein écran : champ stellaire persistant, densité homogène sur tout l’écran.
 * Warp radial : les mêmes étoiles traversent l’espace puis reprennent leur dérive.
 */

import gsap from "gsap"
import { smoothstep } from "./motionDesign.js"

/** Cible : ~1 étoile / 2 600 px² (adapté à la taille d’écran). */
const STAR_DENSITY_PX = 2600
const STAR_COUNT_MIN = 420
const STAR_COUNT_MAX = 680
const FRAME_MS = 1000 / 60

const DRIFT_X = -0.28
const DRIFT_Y = 0.06
const VIEW_PAD = 4

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
let fieldSeed = 42_069

/** @typedef {{
 *   x: number,
 *   y: number,
 *   r: number,
 *   depth: number,
 *   twinkleSpeed: number,
 *   twinkleOffset: number,
 *   baseAlpha: number,
 *   warpX?: number,
 *   warpY?: number,
 *   z?: number,
 *   prevSx?: number,
 *   prevSy?: number,
 * }} Star */
/** @type {Star[]} */
let stars = []
let starCount = STAR_COUNT_MIN

let warpActive = false
let warpSpeed = 0
let blackoutAlpha = 0
/** @type {gsap.core.Timeline | null} */
let warpTimeline = null

/** RNG déterministe par index — positions stables d’une session à l’autre. */
function hash01(n) {
  const x = Math.sin(n * 127.1 + fieldSeed * 0.017) * 43758.5453
  return x - Math.floor(x)
}

function resize() {
  if (!canvas) return
  const w = window.innerWidth
  const h = window.innerHeight
  const prevW = canvas.width
  const prevH = canvas.height
  canvas.width = w
  canvas.height = h
  if (w < 1 || h < 1) return
  if (!stars.length || (prevW > 0 && prevH > 0 && (prevW !== w || prevH !== h))) {
    initStars()
  }
}

function targetStarCount(w, h) {
  const area = w * h
  return Math.min(STAR_COUNT_MAX, Math.max(STAR_COUNT_MIN, Math.round(area / STAR_DENSITY_PX)))
}

/**
 * Grille couvrant tout l’écran : exactement 1 étoile par cellule (cols × rows = count).
 */
function buildEvenGrid(w, h, target) {
  const aspect = w / Math.max(1, h)
  let cols = Math.max(20, Math.round(Math.sqrt(target * aspect)))
  let rows = Math.max(20, Math.ceil(target / cols))
  while (cols * rows < target) cols += 1
  while (cols * rows - cols >= target && rows > 20) rows -= 1
  const count = cols * rows
  return { cols, rows, count, cellW: w / cols, cellH: h / rows }
}

function shuffleCellIndices(count) {
  const perm = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(hash01((i + 1) * 991.7 + fieldSeed * 0.31) * (i + 1))
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  return perm
}

function createStarInCell(i, w, h, cols, rows, cellW, cellH, cellIndex) {
  const col = cellIndex % cols
  const row = Math.floor(cellIndex / cols)
  const inset = 0.06
  const jx = inset + hash01(i * 1.71) * (1 - inset * 2)
  const jy = inset + hash01(i * 2.43) * (1 - inset * 2)
  const x = Math.max(VIEW_PAD, Math.min(w - VIEW_PAD, (col + jx) * cellW))
  const y = Math.max(VIEW_PAD, Math.min(h - VIEW_PAD, (row + jy) * cellH))

  const depth = 0.3 + hash01(i * 11.37) * 0.55
  const r = 0.26 + hash01(i * 23.1) * 0.38
  const baseAlpha = 0.4 + hash01(i * 29.4) * 0.14

  return {
    x,
    y,
    r,
    depth,
    twinkleSpeed: 0.006 + hash01(i * 31.2) * 0.02,
    twinkleOffset: hash01(i * 37.8) * Math.PI * 2,
    baseAlpha,
  }
}

/** Repousse légèrement les paires trop proches (homogénéise la grille). */
function relaxStarSpacing(w, h, list, passes = 4) {
  if (list.length < 2) return
  const minDist = Math.sqrt((w * h) / list.length) * 0.82

  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        if (Math.abs(dx) > w * 0.5) dx += dx > 0 ? -w : w
        const d = Math.hypot(dx, dy)
        if (d >= minDist || d < 0.001) continue
        const push = ((minDist - d) / d) * 0.48
        const px = dx * push
        const py = dy * push
        a.x = Math.max(VIEW_PAD, Math.min(w - VIEW_PAD, a.x - px))
        a.y = Math.max(VIEW_PAD, Math.min(h - VIEW_PAD, a.y - py))
        b.x = Math.max(VIEW_PAD, Math.min(w - VIEW_PAD, b.x + px))
        b.y = Math.max(VIEW_PAD, Math.min(h - VIEW_PAD, b.y + py))
      }
    }
  }

  for (const s of list) {
    s.x = wrapX(s.x, w)
    s.y = clampY(s.y, h)
  }
}

function wrapX(x, w) {
  let v = x
  while (v < -VIEW_PAD) v += w + VIEW_PAD * 2
  while (v > w + VIEW_PAD) v -= w + VIEW_PAD * 2
  return v
}

function clampY(y, h) {
  return Math.max(VIEW_PAD, Math.min(h - VIEW_PAD, y))
}

function clampInView(x, y, w, h) {
  return { x: wrapX(x, w), y: clampY(y, h) }
}

function initStars() {
  if (!canvas || !ctx) return
  const w = canvas.width
  const h = canvas.height
  if (w < 1 || h < 1) return

  const target = targetStarCount(w, h)
  const { cols, rows, count, cellW, cellH } = buildEvenGrid(w, h, target)
  starCount = count
  const perm = shuffleCellIndices(count)

  stars = Array.from({ length: count }, (_, i) =>
    createStarInCell(i, w, h, cols, rows, cellW, cellH, perm[i])
  )
  relaxStarSpacing(w, h, stars, 4)
}

function paintBlackout() {
  if (!ctx || !canvas) return
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function driftNormalStar(s, w, h) {
  const depthFactor = 0.4 + s.depth * 0.85
  s.x += DRIFT_X * depthFactor
  s.y += DRIFT_Y * depthFactor + Math.sin(frame * 0.008 + s.twinkleOffset) * 0.018 * s.depth
  s.x = wrapX(s.x, w)
  s.y = clampY(s.y, h)
}

function beginHyperspaceFromCurrentStars(w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  for (const s of stars) {
    s.prevSx = undefined
    s.prevSy = undefined
    s.z = 0.75 + s.depth * 1.35 + (1.25 - Math.min(1.25, s.r)) * 0.3
    s.warpX = ((s.x - cx) / focal) * s.z
    s.warpY = ((s.y - cy) / focal) * s.z
  }
}

/** Réinjecte l’étoile loin derrière, le long de sa trajectoire radiale (continuité du flux). */
function recycleStarAtDepth(s, w, h) {
  const cx = w * 0.5
  const cy = h * 0.5
  const focal = Math.min(w, h) * 0.68

  let dx = s.prevSx != null ? s.prevSx - cx : (hash01(s.twinkleOffset * 100) - 0.5) * w * 0.2
  let dy = s.prevSy != null ? s.prevSy - cy : (hash01(s.twinkleOffset * 200) - 0.5) * h * 0.2
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len

  const dist = 0.06 + hash01(frame * 0.017 + s.depth * 50) * 0.14
  s.z = 1.75 + s.depth * 0.45 + hash01(s.twinkleOffset * 17) * 0.35
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

function projectStar(s, cx, cy, focal) {
  if (s.z == null || s.warpX == null || s.warpY == null) return null
  const z = Math.max(0.02, s.z)
  return {
    sx: cx + (s.warpX / z) * focal,
    sy: cy + (s.warpY / z) * focal,
    depth: 1 - Math.min(1, z / 2.2),
  }
}

/** Delta horizontal en tenant compte du wrap écran (évite les traits à travers tout l’écran). */
function shortestDx(x0, x1, w) {
  let dx = x1 - x0
  if (dx > w * 0.5) dx -= w
  if (dx < -w * 0.5) dx += w
  return dx
}

/**
 * Traînée radiale (dégradé, pas de stroke) — uniquement si le mouvement est cohérent avec le warp.
 */
function isValidWarpStreak(dx, dy, dist, w, h, sx, sy, cx, cy, speed) {
  if (speed <= 0.05 || dist < 1.2 || dist > Math.min(w, h) * 0.2) return false
  const horiz = Math.abs(dx) / (dist || 1)
  const vert = Math.abs(dy) / (dist || 1)
  if (horiz > 0.92 && vert < 0.12) return false

  const rdx = sx - cx
  const rdy = sy - cy
  const rLen = Math.hypot(rdx, rdy)
  if (rLen < 8) return false
  const dot = (dx * rdx + dy * rdy) / (dist * rLen)
  return dot > 0.2
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

  for (const s of stars) {
    if (!reduced) driftNormalStar(s, w, h)

    const twinkle = reduced
      ? 0.9
      : 0.82 + 0.18 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset)
    const depthBoost = 0.9 + s.depth * 0.1
    const alpha = Math.min(1, s.baseAlpha * twinkle * depthBoost)
    const radius = s.r * (0.92 + s.depth * 0.12)

    ctx.beginPath()
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2)
    const warm = Math.floor(210 + s.depth * 25)
    ctx.fillStyle = `hsla(${warm}, 18%, ${88 + s.depth * 10}%, ${alpha})`
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

    const twinkle = 0.8 + 0.2 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset)
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

/** Reprend les positions écran post-warp en conservant le champ (wrap horizontal). */
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

    s.x = wrapX(x, w)
    s.y = clampY(y, h)
    delete s.warpX
    delete s.warpY
    delete s.z
    delete s.prevSx
    delete s.prevSy
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
  if (rafId == null) rafId = requestAnimationFrame(draw)
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
 * Finale : étoiles vers l’observateur puis fondu au noir (fin de présentation).
 * @param {{ durationSec?: number, onComplete?: () => void }} [opts]
 */
export function runPresentationFinale(opts = {}) {
  const { durationSec = 1.65, onComplete } = opts

  return new Promise((resolve) => {
    stopHyperspaceWarp()
    blackoutAlpha = 0

    const done = () => {
      blackoutAlpha = 1
      paintBlackout()
      stopHyperspaceWarp()
      stopLoop()
      onComplete?.()
      resolve()
    }

    if (reduced || !active || !canvas || !ctx) {
      done()
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

    const state = { warp: 0, black: 0 }
    const accelDur = durationSec * 0.78
    const blackDur = durationSec * 0.42

    warpTimeline = gsap.timeline({ onComplete: done })

    warpTimeline.to(state, {
      warp: 1,
      duration: accelDur,
      ease: "power3.in",
      onUpdate: () => {
        let v = smoothstep(state.warp)
        if (state.warp > 0.65) v = Math.min(1.2, v * (1 + (state.warp - 0.65) * 1.4))
        warpSpeed = v
      },
    })

    warpTimeline.to(
      state,
      {
        black: 1,
        duration: blackDur,
        ease: "power2.in",
        onUpdate: () => {
          blackoutAlpha = state.black
          warpSpeed = Math.max(warpSpeed, 0.92)
        },
      },
      accelDur * 0.52
    )
  })
}

/**
 * @param {{ durationSec?: number, onCut?: () => void, onComplete?: () => void }} opts
 * @returns {Promise<void>}
 */
export function runHyperspaceWarp(opts = {}) {
  const { durationSec = 1.2, onCut, onComplete } = opts

  return new Promise((resolve) => {
    stopHyperspaceWarp()

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
    if (!warpActive && !stars.length) initStars()
    lastFrame = 0
    startLoop()
  } else {
    stopHyperspaceWarp()
    stopLoop()
  }
}

/** Réactive le ciel après la finale « Terminer la présentation ». */
export function restartStarsAfterFinale() {
  blackoutAlpha = 0
  stopHyperspaceWarp()
  if (!canvas || !ctx) return
  active = true
  canvas.hidden = false
  resize()
  initStars()
  lastFrame = 0
  startLoop()
}
