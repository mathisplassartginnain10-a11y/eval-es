/**
 * Animation sphère parfaite → sphéroïde oblate (extrait de docs/prompts/sphere-animation.html).
 * @param {HTMLElement} container
 * @param {{ embed?: boolean }} [opts]
 */
export function createSphereAnim(container, opts = {}) {
  const embed = !!opts.embed

  container.innerHTML = `
<div class="sphere-anim" role="img" aria-label="Déformation de la Terre d’une sphère vers un sphéroïde oblate">
  <canvas class="sphere-anim__canvas" width="340" height="340"></canvas>
  <div class="sphere-anim__post">
    <div class="sphere-anim__title"></div>
    <div class="sphere-anim__metrics">
      <div class="sphere-anim__metric">
        <span class="sphere-anim__metric-val sphere-anim__metric-val--eq"></span>
        <span class="sphere-anim__metric-label">Rayon équatorial</span>
      </div>
      <div class="sphere-anim__metric">
        <span class="sphere-anim__metric-val sphere-anim__metric-val--pol"></span>
        <span class="sphere-anim__metric-label">Rayon polaire</span>
      </div>
    </div>
  </div>
  ${embed ? "" : `<div class="sphere-anim__btn-row">
    <button type="button" class="sphere-anim__btn sphere-anim__btn-play">▶ Lancer</button>
    <button type="button" class="sphere-anim__btn sphere-anim__btn-reset">↺ Réinitialiser</button>
  </div>`}
</div>`

  const canvas = container.querySelector(".sphere-anim__canvas")
  const elTitle = container.querySelector(".sphere-anim__title")
  const elValEq = container.querySelector(".sphere-anim__metric-val--eq")
  const elValPol = container.querySelector(".sphere-anim__metric-val--pol")
  const btnPlay = container.querySelector(".sphere-anim__btn-play")
  const btnReset = container.querySelector(".sphere-anim__btn-reset")

  if (!(canvas instanceof HTMLCanvasElement) || !elTitle || !elValEq || !elValPol) {
    throw new Error("createSphereAnim: structure DOM incomplète")
  }

  const ctx = canvas.getContext("2d")
  const W = 340
  const H = 340
  const CX = W / 2
  const CY = H / 2

  const EQ_START = 6371
  const EQ_END = 6378
  const POL_START = 6371
  const POL_END = 6357

  const RX_START = 120
  const RX_END = 140
  const RY_START = 120
  const RY_END = 100

  const DURATION = 4000

  let _progress = 0
  let _playing = false
  let _startTs = null
  /** @type {number | null} */
  let _raf = null

  const STARS = Array.from({ length: 42 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 0.9 + 0.3,
    a: Math.random() * 0.4 + 0.2
  }))

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  function fmt(v) {
    return Math.round(v)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") + " km"
  }

  function updateDOM(t, eq, pol) {
    elValEq.textContent = fmt(eq)
    elValPol.textContent = fmt(pol)
    if (t < 0.03) {
      elTitle.textContent = "Sphère parfaite"
    } else if (t > 0.97) {
      elTitle.textContent = "Sphéroïde oblate"
    } else {
      elTitle.textContent = "Déformation en cours…"
    }
  }

  function draw(t) {
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)

    const eq = lerp(EQ_START, EQ_END, t)
    const pol = lerp(POL_START, POL_END, t)
    const rx = lerp(RX_START, RX_END, t)
    const ry = lerp(RY_START, RY_END, t)

    STARS.forEach((s) => {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.a})`
      ctx.fill()
    })

    ctx.save()
    ctx.scale(rx / ry, 1)
    const halo = ctx.createRadialGradient(CX * (ry / rx), CY, ry * 0.9, CX * (ry / rx), CY, ry * 1.22)
    halo.addColorStop(0, "rgba(60,130,255,0.22)")
    halo.addColorStop(1, "rgba(60,130,255,0)")
    ctx.beginPath()
    ctx.arc(CX * (ry / rx), CY, ry * 1.22, 0, Math.PI * 2)
    ctx.fillStyle = halo
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.scale(rx / ry, 1)
    const grad = ctx.createRadialGradient((CX - rx * 0.28) * (ry / rx), CY - ry * 0.28, 6, CX * (ry / rx), CY, ry)
    grad.addColorStop(0, "#1e5299")
    grad.addColorStop(0.45, "#0d2d5e")
    grad.addColorStop(1, "#040d1f")
    ctx.beginPath()
    ctx.arc(CX * (ry / rx), CY, ry, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()

    ctx.save()
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue
      const angle = (i / 4) * (Math.PI / 2)
      const yOff = Math.sin(angle) * ry
      const xW = Math.cos(angle) * rx
      ctx.beginPath()
      ctx.moveTo(CX - xW, CY + yOff)
      ctx.lineTo(CX + xW, CY + yOff)
      ctx.strokeStyle = "rgba(255,255,255,0.06)"
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(100,160,255,0.55)"
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.scale(rx / ry, 1)
    const ref = ctx.createRadialGradient(
      (CX - rx * 0.32) * (ry / rx),
      CY - ry * 0.32,
      0,
      (CX - rx * 0.32) * (ry / rx),
      CY - ry * 0.32,
      ry * 0.48
    )
    ref.addColorStop(0, "rgba(255,255,255,0.08)")
    ref.addColorStop(1, "rgba(255,255,255,0)")
    ctx.beginPath()
    ctx.arc(CX * (ry / rx), CY, ry, 0, Math.PI * 2)
    ctx.fillStyle = ref
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(CX, CY - ry - 20)
    ctx.lineTo(CX, CY + ry + 20)
    ctx.strokeStyle = "rgba(78,205,196,0.55)"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(CX - rx - 20, CY)
    ctx.lineTo(CX + rx + 20, CY)
    ctx.strokeStyle = "rgba(74,158,255,0.55)"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.lineTo(CX + rx, CY)
    ctx.strokeStyle = "#4A9EFF"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(CX + rx, CY)
    ctx.lineTo(CX + rx - 8, CY - 4)
    ctx.lineTo(CX + rx - 8, CY + 4)
    ctx.closePath()
    ctx.fillStyle = "#4A9EFF"
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.lineTo(CX, CY - ry)
    ctx.strokeStyle = "#4ECDC4"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(CX, CY - ry)
    ctx.lineTo(CX - 4, CY - ry + 8)
    ctx.lineTo(CX + 4, CY - ry + 8)
    ctx.closePath()
    ctx.fillStyle = "#4ECDC4"
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.font = "bold 12px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#4A9EFF"
    ctx.fillText(fmt(eq), CX + 8, CY - 10)
    ctx.fillStyle = "#4ECDC4"
    ctx.fillText(fmt(pol), CX + 8, CY - ry + 18)
    ctx.restore()

    updateDOM(t, eq, pol)
  }

  function step(ts) {
    if (!_startTs) _startTs = ts
    const raw = Math.min((ts - _startTs) / DURATION, 1)
    _progress = ease(raw)
    draw(_progress)
    if (raw < 1) {
      _raf = requestAnimationFrame(step)
    } else {
      _playing = false
      if (btnPlay) btnPlay.textContent = "▶ Lancer"
    }
  }

  const api = {
    play() {
      if (_playing) return
      _playing = true
      _startTs = null
      if (btnPlay) btnPlay.textContent = "⏸ En cours…"
      _raf = requestAnimationFrame(step)
    },

    reset() {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      _startTs = null
      _progress = 0
      if (btnPlay) btnPlay.textContent = "▶ Lancer"
      draw(0)
    },

    seek(t) {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      _progress = Math.max(0, Math.min(1, t))
      draw(_progress)
    },

    isPlaying() {
      return _playing
    },

    destroy() {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      container.replaceChildren()
    }
  }

  if (btnPlay) btnPlay.addEventListener("click", () => api.play())
  if (btnReset) btnReset.addEventListener("click", () => api.reset())

  draw(0)

  return api
}
